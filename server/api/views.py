import datetime
import json
import traceback
import urllib.parse
import urllib
from json import JSONDecodeError
from typing import Dict, List

from django.http import JsonResponse, HttpRequest, HttpResponse
from django.middleware.csrf import get_token
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import Permission, User, Group
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.conf import settings
from drf_yasg.utils import swagger_auto_schema
from requests import delete
from rest_framework import status, generics
from rest_framework import views
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser

from api.authentication import CsrfExemptSessionAuthentication
from api.serializers import *
from api.api_serializers import *
from api.sklec.RSKCore import RSKCore
from api.sklec.NcfCore import NcfCoreClass, NcfFileUploadClass
from api.sklec.VisualQueryManager import VisualQueryManager
from api.models import Dataset

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



class DatasetCreate(views.APIView):
    permission_classes = [IsAuthenticated]

    # serializer_class = DatasetCreateSerializer

    @swagger_auto_schema(operation_description='添加一个新的数据集。',
                         query_serializer = DatasetCreateSerializer,
                         responses = {
                             200: CreateDatasetResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def post(self, request: HttpRequest, *args, **kwargs):
        try:
            validation = DatasetCreateSerializer(data=json.loads(request.body.decode('utf-8')))
            if not validation.is_valid():
                return JsonResponseError(validation.errors)
            params = validation.data
            user = SiteUser.objects.get(user=request.user)
            params['created_by'] = user
            dataset = Dataset(**params)
            dataset.save()
            uuid = dataset.uuid
            return JsonResponseOK(data = {
                'uuid' : uuid
            })
        except Exception as e:
            return JsonResponseError(message=e.args)


class DataContent(generics.RetrieveUpdateAPIView):
    serializer_class = DatasetDetailSerializer
    lookup_field = 'uuid'

    def get_queryset(self):
        return Dataset.objects.all()

    @swagger_auto_schema(operation_description='获取指定数据集的详细信息。',)
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)


class DatasetDestroy(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    # serializer_class = DatasetDestroySerializer
    lookup_field = 'uuid'

    def get_queryset(self):
        return Dataset.objects.all()

    @swagger_auto_schema(operation_description='删除指定数据集。',
                         responses={
                             204: SuccessResponseSerializer,
                             404: ErrorResponseSerializer,
                         })
    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            self.perform_destroy(instance)
        except Exception as e:
            return JsonResponseError(message=e.args)

        return JsonResponseOK(data={'message': 'success'})

class DatasetTagsAdd(views.APIView):

    lookup_field = 'uuid'
    serializer_class = DatasetTagsAddSerializer

    def get_queryset(self):
        return Dataset.objects.all()

    @swagger_auto_schema(operation_description='为指定数据集添加标签，不可重复添加同一标签。',
                         query_serializer = DatasetTagsAddSerializer,
                         responses={
                             200: SuccessResponseSerializer,
                             400: ErrorResponseSerializer,
                         })
    def get(self, request, *args, **kwargs):
        uuid_tag = request.query_params['uuid_tag']
        uuid_dataset = kwargs['uuid']
        try:
            dataset = Dataset.objects.get(uuid=uuid_dataset)
            tag = DatasetTag.objects.get(uuid=uuid_tag)
            if dataset.tags.filter(id=tag.id).exists():
                return JsonResponseError(message=f"Tag {tag.name} (uuid = {uuid_tag}) already exists.")
            dataset.tags.add(tag.id)
            dataset.save()
        except Exception as e:
            return JsonResponseError(message=e.args)
        return JsonResponseOK()

class DatasetTagsRemove(views.APIView):

    def get_queryset(self):
        return Dataset.objects.all()

    @swagger_auto_schema(operation_description='为指定数据集删除标签，只能删除已存在的标签。',
                         query_serializer = DatasetTagsAddSerializer,
                         responses={
                             200: SuccessResponseSerializer,
                             400: ErrorResponseSerializer,
                         })
    def get(self, request, *args, **kwargs):
        uuid_tag = request.query_params['uuid_tag']
        uuid_dataset = kwargs['uuid']
        try:
            dataset = Dataset.objects.get(uuid=uuid_dataset)
            tag = DatasetTag.objects.get(uuid=uuid_tag)
            if not dataset.tags.filter(id=tag.id).exists():
                return JsonResponseError(message=f"Tag {tag.name} (uuid = {uuid_tag}) does not exists.")
            dataset.tags.remove(tag.id)
            dataset.save()
        except Exception as e:
            return JsonResponseError(message=e.args)
        return JsonResponseOK()

class TagList(generics.ListAPIView):

    serializer_class = SimpleDatasetTagSerializer
    def get_queryset(self):
        return DatasetTag.objects.all()

    @swagger_auto_schema(operation_description='获取系统中的所有标签。如果标签含有 parent 属性，则表明该标签为某个父标签的子标签。' +
        '使用这种方式来表达标签的层级关系，从而来实现标签的嵌套关系。',)
    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

class GetNcfContentVQDatastream(views.APIView):

    @swagger_auto_schema(operation_description="从指定 VisFile 中根据经纬度和深度获取所有变量的时域特征。",
                         query_serializer=GetNcfContentVQDatastreamRequestSerializer,
                         responses= {
                             200: GetNcfContentVQDatastreamResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def get(self, request: HttpRequest, *args, **kwargs):
        validation = GetNcfContentVQDatastreamRequestSerializer(data=request.query_params)
        if not validation.is_valid():
            return JsonResponseError(validation.errors)
        params = validation.data
        uuid = kwargs['uuid']
        try:
            visfile = VisFile.objects.get(uuid=uuid)
        except VisFile.DoesNotExist as e:
            return JsonResponseError(f'VisFile with uuid {uuid} does not exist.')

        core = NcfCoreClass(visfile.file.path)
        vq_data = core.get_vq_datastream(params)
        return JsonResponseOK(data = vq_data)

class GetRskContent(views.APIView):

    @swagger_auto_schema(operation_description='从指定 RSK VisFile 中获取指定 Channel 的数据',
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

class RawfileUpdateView(generics.UpdateAPIView):
    serializer_class = RawfileUpdateSerializer
    lookup_field = 'uuid'

    def get_queryset(self):
        return RawFile.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        try:
            instance = self.get_object()
        except Exception as e:
            return JsonResponseError(f'rawfile with uuid {kwargs["uuid"]} not found.')
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        if (not serializer.is_valid):
            return JsonResponseError(serializer.errors)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return JsonResponseOK(data=serializer.data)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @swagger_auto_schema(operation_description='更新指定Visfile信息。',
                         responses={
                             200: ResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

class RawfileDestroyView(generics.DestroyAPIView):
    lookup_field = 'uuid'

    def get_queryset(self):
        return RawFile.objects.all()

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except Exception as e:
            return JsonResponseError(f'visfile with uuid {kwargs["uuid"]} not found.')
        self.perform_destroy(instance)
        return JsonResponseOK()

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)

class VisfileUpdateView(generics.UpdateAPIView):
    serializer_class = VisfileUpdateSerializer
    lookup_field = 'uuid'

    def get_queryset(self):
        return VisFile.objects.all()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        try:
            instance = self.get_object()
        except Exception as e:
            return JsonResponseError(f'visfile with uuid {kwargs["uuid"]} not found.')
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        if (not serializer.is_valid):
            return JsonResponseError(serializer.errors)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            # If 'prefetch_related' has been applied to a queryset, we need to
            # forcibly invalidate the prefetch cache on the instance.
            instance._prefetched_objects_cache = {}

        return JsonResponseOK(data=serializer.data)

    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @swagger_auto_schema(operation_description='更新指定Visfile信息。',
                         responses={
                             200: ResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

class VisfileDestroyView(generics.DestroyAPIView):
    lookup_field = 'uuid'

    def get_queryset(self):
        return VisFile.objects.all()

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
        except Exception as e:
            return JsonResponseError(f'visfile with uuid {kwargs["uuid"]} not found.')
        self.perform_destroy(instance)
        return JsonResponseOK()

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)

class GetNcfContent(views.APIView):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(operation_description='从指定 VisFile 中获取指定 Channel 的数据(仅限NCF)',
                         query_serializer=GetNcfContentRequestSerializer,
                         response={
                             200: GetNcfContentResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def get(self, request, *args, **kwargs):
        dimension_list = ['datetime', 'longitude', 'latitude', 'depth']

        # data_prev = dict(request.query_params) # .copy()
        # for dimension in dimension_list:
        #     if (dimension in data_prev.keys()):
        #         data_prev[dimension] = data_prev[dimension][0].split(",")

        #         for i in range(len(data_prev[dimension])):
        #             data_prev[dimension][i] = int(data_prev[dimension][i])
        validation = GetNcfContentRequestSerializer(data=request.query_params)
        if not validation.is_valid():
            return JsonResponseError(validation.errors)
        params = validation.data
        uuid = kwargs['uuid']
        params['uuid'] = uuid
        try:
            visfile = VisFile.objects.get(uuid=uuid)
        except VisFile.DoesNotExist as e:
            return JsonResponseError(f'VisFile with uuid {uuid} does not exist.')
        channel_label = params['channel_label']
        channel_label_exists = 0
        for dimension in visfile.meta_data['variables']:
            if (channel_label == dimension['variable_name']):
                channel_label_exists = 1
        if (not channel_label_exists):
            return JsonResponseError(f'Channel label with label {channel_label} does not exist.')

        for dimension in visfile.meta_data['dimensions']:
            name = dimension['dimension_name']
            length = dimension['dimension_length']
            typ = dimension['dimension_type']
            for dim in dimension_list:
                if (dim == typ):
                    if (params[dim + '_start'] == -1):
                        params[dim + '_start'] = 0
                    if (params[dim + '_end'] == -1):
                        params[dim + '_end'] = length - 1

                    if params[dim + '_start'] > params[dim + '_end']:
                        return JsonResponseError(f'Dimention range with dimention {dim} is invalid. Start is larger than end.')
                    if params[dim + '_start'] < 0:
                        return JsonResponseError(f'Dimention range with dimention {dim} is invalid. Start is out of range.')
                    if params[dim + '_end'] > length - 1:
                        return JsonResponseError(f'Dimention range with dimention {dim} is invalid. End is out of range.')
                    break

        if params['res_limit'] == -1:
            params['res_limit'] = 100000000
        if params['filenum_limit'] == -1:
            params['filenum_limit'] = 100000000
        if params['res_limit'] < 1:
            return JsonResponseError(f'Resolution limit is invalid. Should greater than 0.')
        if params['filenum_limit'] < 1:
            return JsonResponseError(f'Filenum limit is invalid. Should greater than 0.')

        return_type = 'tiff' # default is tiff
        if params.__contains__('return_type'):
            return_type = params['return_type']

        scalar_format = 6
        if params.__contains__('scalar_format'):
            scalar_format = params['scalar_format']
            # scalar_format = urllib.parse.unquote(params['scalar_format'])
        # URLDecoder.decode(params['return_scalar_format'], "utf-8")
        core = NcfCoreClass(visfile.file.path)
        data = {}
        if return_type == 'array':
            channel_data_array_list = core.get_channel_data_array(params)
            data['arrays'] = channel_data_array_list
        elif return_type == 'tiff':
            file_meta_list: List[Dict] = core.get_channel_data_split(params)
            files = []
            for f in file_meta_list:
                url = f['filepath'].replace(settings.MEDIA_ROOT, '/media')
                f['file'] = request.build_absolute_uri(url)
                del f['filepath']
            data['files'] = file_meta_list
        else:
            return JsonResponseError(f'VisFile with return_type {return_type} is not supported.')
        return JsonResponseOK(data=data)


class Login(views.APIView):

    authentication_classes = (CsrfExemptSessionAuthentication, )

    @swagger_auto_schema(operation_description='用户登录',
                         operation_id='user_login',
                         request_body=POSTLoginRequestSerializer,
                         response={
                             200: SuccessResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def post(self, request: HttpRequest, *args, **kwargs):
        try:
            jdata = json.loads(request.body.decode('utf-8'))
        except JSONDecodeError as e:
            return JsonResponseError('Invalid request body. Check your json format.')

        params = jdata
        username = params.get('username')
        password = params.get('password')

        user = authenticate(username=username, password=password)
        if user is None:
            return JsonResponseError(f'User does not exist.')
        if not user.is_active:
            return JsonResponseError(f'User is not active.')

        login(request, user)

        data = {}
        data['token'] = 'this is a token'
        return JsonResponseOK(data=data)


class Logout(views.APIView):

    @swagger_auto_schema(operation_description='用户登出',
                         operation_id='user_logout',
                         response={
                             200: SuccessResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponseError(f'Invalid user identity.')
        logout(request)
        data = {}
        return JsonResponseOK(data=data)


class Register(views.APIView):

    authentication_classes = (CsrfExemptSessionAuthentication, )

    @swagger_auto_schema(operation_description='用户注册',
                         operation_id='user_register',
                         request_body=RegisterRequestSerializer,
                         response={
                             200: SuccessResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def post(self, request: HttpRequest, *args, **kwargs):
        try:
            jdata = json.loads(request.body.decode('utf-8'))
        except JSONDecodeError as e:
            return JsonResponseError('Invalid request body. Check your json format.')

        params = jdata

        username = params.get('username')
        password = params.get('password')
        user_email = params.get('email')
        display_name = params.get('display_name')
        affiliation = params.get('affiliation')
        country = params.get('country')
        phone = params.get('phone')
        address = params.get('address')
        city = params.get('city')
        state = params.get('state')

        user = User(username=username, email=user_email)
        user.set_password(password)

        group = Group.objects.get(name='data_viewer')
        user.groups.add(group)
        user.save()

        user_serializer = SiteUser(user=user,
                                   display_name=display_name,
                                   affiliation=affiliation,
                                   country=country,
                                   phone=phone,
                                   address=address,
                                   city=city,
                                   state=state
        )
        user_serializer.affiliation = affiliation

        user = user_serializer.save()

        data = {}
        data['username'] = username
        return JsonResponseOK(data=data)


class GetUserProfile(views.APIView):

    @swagger_auto_schema(operation_description='用户信息',
                         operation_id='user_profile',
                         response={
                             200: GetUserProfileResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponseError('Invalid user identity.')

        user = SiteUser.objects.get(user=request.user)
        site_data = user.__dict__
        site_data['_state'] = None
        user_data = {
            'username': request.user.username,
            'user_email': request.user.email,
            'login_time': request.user.last_login
        }
        data = user_data.copy()
        data.update(site_data)
        # print('\n'.join(['{0}: {1}'.format(item[0], item[1]) for item in data.items()]))
        return JsonResponseOK(data=data)


class FileUploadView(views.APIView):
    parser_classes = (MultiPartParser, )

    @swagger_auto_schema(operation_description='上传rawfile至指定dataset',
                         request_body=RawFileUploadSerializer,
                         responses= {
                             200: SuccessResponseSerializer,
                             400: ErrorResponseSerializer,
                         })
    def post(self, request: HttpRequest, format=None):
        # try:
            file = request.FILES['file']
            if (file.name.endswith('.nc')):
                core = NcfFileUploadClass(file)

            params = request.POST
            res = core.create(params)
            if res == 'success':
                return JsonResponseOK()
            else:
                return JsonResponseError()
        # except Exception as e:
        #     return JsonResponseError(message=e.args)


class SendVerificationEmail(views.APIView):

    @swagger_auto_schema(operation_description='发送验证邮件',
                         operation_id='send_verification_email',
                         response={
                             200: SuccessResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponseError('Invalid user identity.')
        user = SiteUser.objects.get(user=request.user)
        if user.is_activated:
            return JsonResponseError('User email is already verified.')

        token = str(uuid.uuid4()).replace('-','')
        user.email_token = token
        # 设置过期时间字段供校验 user.email_token_expire_time = {timestamp}
        user.save()

        host = '{scheme}://{host}'.format(scheme=request.scheme, host=request.get_host())
        path = '{}/api/user/email/verify/{}/'.format(host, token)
        msg = '''
        你好，这是一封邮箱验证邮件，请<br><a href="{}">点击链接</a>
        <br>或复制以下链接到浏览器访问以激活您的邮箱。
        <br>{}
        <br>链接有效期为3天。
        <br>sklec-vis
        '''.format(path, path)
        email_address = user.user.email

        # send email, get error code
        send_status = send_mail(
            subject='sklec-vis用户邮箱激活验证',
            message=msg,
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[email_address],
            fail_silently=False,
            html_message=msg,
        )
        if not send_status:
            return JsonResponseError('Send verification email failed')
        return JsonResponseOK(data={})


class VerifyEmailToken(views.APIView):

    authentication_classes = (CsrfExemptSessionAuthentication,)

    @swagger_auto_schema(operation_description='验证邮箱认证链接',
                         operation_id='verify_email_token',
                         response={
                             200: SuccessResponseSerializer,
                             400: ErrorResponseSerializer,
                             500: ErrorResponseSerializer,
                         })
    def get(self, request, *args, **kwargs):
        token_str = kwargs['tokenstr']
        try:
            user = SiteUser.objects.get(email_token=token_str)
            if user is None:
                return JsonResponseError('Invalid token for email verification.')
            if user.is_activated:
                return JsonResponseError('User email is already verified.')
            user.is_activated = True
            user.save()
        except User.DoesNotExist:
            return JsonResponseError('User does not exist.')
        return JsonResponseOK(data={'result': 'Successfully verified your email address.'})


def not_found(request: HttpRequest) -> HttpResponse:
    return JsonResponse({
        'detail': f'{request.method} {request.path} not found. See documents at {request.build_absolute_uri("/api/swagger/")}.'
    }, status=status.HTTP_404_NOT_FOUND)