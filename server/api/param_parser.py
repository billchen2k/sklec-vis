"""
@author: Bill Chen
@file: param_parser.py
@created: 2022/3/18 11:42
@description:
"""

from typing import List
from drf_yasg import openapi
from rest_framework.request import Request
from datetime import datetime


class InvalidParamException(Exception):
    pass

class InvalidParamSchemeException(Exception):
    pass


class Param:
    def __init__(self, name, in_, description='', required=False, default=None, multiple=False, valid_values: List = None, schema: openapi.Schema = None):
        """

        :param name:
        :param in_: 使用 openapi.IN_QUERY, openapi.IN_PATH, openapi.IN_FORM, openapi.IN_HEADER 等。
        :param description:
        :param required:
        :param valid_values: None
        :param default: 默认值只会在文档中生效，帮助 swagger 调参，实际值不会被设置。
        """
        self.name = name
        self.in_ = in_
        self.description = description
        self.required = required
        self.default = default
        self.multiple = multiple
        self.valid_values = valid_values
        self.schema = schema

        if schema and valid_values:
            raise InvalidParamSchemeException('schema and valid_values can not be both set.')

        if not schema and valid_values:
            if multiple:
                self.schema = openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Schema(type=openapi.TYPE_STRING, enum=valid_values))
            else:
                self.schema = openapi.Schema(type=openapi.TYPE_STRING, enum=valid_values)




class ParamParser:

    def __init__(self, params: List[Param] = [], with_limit_offset=False):
        self.params = params
        if with_limit_offset:
            self.add_param(Param('limit', openapi.IN_QUERY, 'Number of items to return', default=100))
            self.add_param(Param('offset', openapi.IN_QUERY, 'Number of items to skip', default=0))

    def add_param(self, param):
        self.params.append(param)

    def validate_params(self, request: Request):
        for param in self.params:
            if param.required:
                if param.in_ == openapi.IN_QUERY and param.name not in request.query_params:
                    raise InvalidParamException(f'Missing required query param: {param.name}')

            if param.name in request.query_params:
                if param.valid_values is not None:
                    if request.query_params[param.name] not in param.valid_values:
                        raise InvalidParamException(f'Invalid value for query param: {param.name}')

    def manual_parameters(self):
        """
        生成用于 swagger 的 parameters。
        :return:
        """
        mp = []
        for param in self.params:
            mp.append(openapi.Parameter(
                name=param.name,
                in_=param.in_,
                description=param.description,
                required=param.required,
                default=param.default
            ))

    def get_query_param_map(self, request: Request):
        param_map = {}
        for param in self.params:
            if param.name in request.query_params:
                param_map[param.name] = request.query_params[param.name]

        return param_map