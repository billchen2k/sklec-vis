import datetime
import traceback

from django.http import JsonResponse, HttpRequest, HttpResponse
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import status, generics
from rest_framework import views

from api.models import *
from api.serializers import *
from api.request_serializers import *
from api.sklec.RSKCore import RSKCore


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
        return Dataset.objects.all()

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

    @swagger_auto_schema(operation_description='从指定数据集中获取指定 Channel 的数据',
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
        except Exception as e:
            return JsonResponseError(e.message)

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



def not_found(request: HttpRequest) -> HttpResponse:
    return JsonResponse({
        'detail': f'{request.method} {request.path} not found. See documents at {request.build_absolute_uri("/api/swagger/")}.'
    }, status=status.HTTP_404_NOT_FOUND)