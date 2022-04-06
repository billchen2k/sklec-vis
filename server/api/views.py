import datetime
import json
import traceback
from json import JSONDecodeError

from django.http import JsonResponse, HttpRequest, HttpResponse
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, generics
from rest_framework import views

from api.authentication import CsrfExemptSessionAuthentication
from api.serializers import *
from api.api_serializers import *
from api.sklec.RSKCore import RSKCore
from api.sklec.VisualQueryManager import VisualQueryManager


def JsonResponseOK(data=None):
    return JsonResponse({
        'success': True,
        'data': data,
        'message': 'ok'
    }, status=status.HTTP_200_OK)

def JsonResponseError(message: str, error = None, status: int = status.HTTP_400_BAD_REQUEST):
    return JsonResponse({
        'success': False,
        'message': message,
        'error': error
    }, status=status)

class DatasetList(generics.ListAPIView):

    serializer_class = DatasetSerializer
    def get_queryset(self):
        return Dataset.objects.all().order_by('name')

    @swagger_auto_schema(operation_description='获取系统中的所有数据集。',)
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)


class DataContent(generics.RetrieveAPIView):
    serializer_class = DatasetDetailSerializer
    lookup_field = 'uuid'

    def get_queryset(self):
        return Dataset.objects.all()

    @swagger_auto_schema(operation_description='获取指定数据集的详细信息。',)
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

class GetVisContent(views.APIView):

    @swagger_auto_schema(operation_description='从指定 VisFile 中获取指定 Channel 的数据',
                         query_serializer=GetVisContentRequestSerializer,
                         responses={
                             200: GetVisContentResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def get(self, request, *args, **kwargs):
        validation = GetVisContentRequestSerializer(data=request.query_params)
        if not validation.is_valid():
            return JsonResponseError(validation.errors)
        params = validation.data
        print(request.query_params)
        uuid = kwargs['uuid']
        try:
            visfile = VisFile.objects.get(uuid=uuid)
        except VisFile.DoesNotExist as e:
            return JsonResponseError(f'VisFile with uuid {uuid} does not exist.')

        if params['all_channels'] == True:
            channels = visfile.data_channels.all()
        else:
            return JsonResponseError('Currently only support all_channels=True', status=status.HTTP_400_BAD_REQUEST)

        if params.get('datetime_start') and params.get('datetime_end'):
            datetime_start = datetime.datetime.fromisoformat(params['datetime_start'].replace('Z', '+00:00'))
            datetime_end = datetime.datetime.fromisoformat(params['datetime_end'].replace('Z', '+00:00'))
        else:
            datetime_start = None
            datetime_end = None

        if visfile.format == VisFile.FileFormat.RSK:

            try:
                core = RSKCore(visfile.file.path)
                print(params)
                if params.get('target_samples'):
                    core.TARGET_VIS_LENGTH = int(params['target_samples'])
                vis_data = core.get_all_channel_data(start_time=datetime_start, end_time=datetime_end)
                core.close()
                return JsonResponseOK({
                    'vis_data': vis_data,
                    'channels': [name for name in vis_data.keys()],
                    'channel_labels': core.get_channels(),
                    'sample_count': len(vis_data[visfile.first_dimension_name]),
                    'datetime_start': vis_data[visfile.first_dimension_name][0],
                    'datetime_end': vis_data[visfile.first_dimension_name][-1],
                    'file_name': visfile.file_name,
                    'file_size': visfile.file_size,
                    'first_dimension_name': visfile.first_dimension_name,
                })

            except Exception as e:
                print(traceback.format_exc())
                return JsonResponseError(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return JsonResponseError(f'Visfile format {visfile.format} currently not supported.')

class PostVQDataStream(views.APIView):

    authentication_classes = (CsrfExemptSessionAuthentication, )

    @swagger_auto_schema(operation_description='从时空数据中根据不同空间查询点获取时域特征。Post Body 应该包括请求点和 Vis File 的 UUID。',
                         operation_id='viscontent_vqdatastream',
                         request_body=PostVQDataStreamRequestSerializer,
                         responses={
                             200: PostVQDataStreamResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })

    def post(self, request: HttpRequest, *args, **kwargs):
        try:
            jdata = json.loads(request.body.decode('utf-8'))
        except JSONDecodeError as e:
            return JsonResponseError('Invalid request body. Check your json format.')
        validation = PostVQDataStreamRequestSerializer(data=jdata, context={'request': request})
        if not validation.is_valid():
            return JsonResponseError(validation.errors)
        params = validation.data
        print(params)
        lat_lngs = params.get('lat_lngs')
        radius = params.get('radius', 1)
        visfile_final = []
        if params.get('visfile_uuid') and len(params.get('visfile_uuid')) > 0:
            for uuid in params.get('visfile_uuid'):
                try:
                    f = VisFile.objects.get(uuid=uuid)
                except VisFile.DoesNotExist:
                    return JsonResponseError(f'Visfile with uuid {uuid} does not exist.')
                if f.format == VisFile.FileFormat.TIFF:
                    visfile_final.append(f)
        elif params.get('dataset_uuid'):
            dataset_uuid = params.get('dataset_uuid')
            try:
                datasetObj = Dataset.objects.get(uuid=dataset_uuid)
            except Dataset.DoesNotExist:
                return JsonResponseError(f'Dataset with uuid {dataset_uuid} does not exist.')
            if datasetObj.dataset_type != Dataset.DatasetType.RASTER:
                return JsonResponseError('Dataset must be of Raster (RT) type.')
            visfile_final = datasetObj.vis_files.all()
        else:
            return JsonResponseError('Either visfile_uuid or dataset_uuid must be provided.')
        if len(visfile_final) == 0:
            return JsonResponseError('No visfile that meets the requirements for Visual Query.' +
                                     'Note that the visfile must be TIFF format.')

        visfile_final = sorted(visfile_final, key=lambda x: x.datetime_start.timestamp())
        lat_lngs_tuples = []
        for one in lat_lngs:
            lat_lngs_tuples.append((one.get('lat'), one.get('lng')))

        manager = VisualQueryManager(visfiles=visfile_final,
                                     lat_lngs=lat_lngs_tuples,
                                     radius=radius)
        manager.gen_data_stream()
        return JsonResponseOK({
            'date_data': manager.date_series,
            'stream_data': manager.data_stream,
            'lat_lngs': lat_lngs,
        })

@swagger_auto_schema(operation_description='获取 CSRF Token.', operation_id='csrf_token')
def token(request: HttpRequest) -> HttpResponse:
    token = get_token(request)
    response = JsonResponseOK({'token': token})
    response['X-CSRFToken'] = token
    return response

def not_found(request: HttpRequest) -> HttpResponse:
    return JsonResponse({
        'detail': f'{request.method} {request.path} not found. See documents at {request.build_absolute_uri("/api/swagger/")}.'
    }, status=status.HTTP_404_NOT_FOUND)