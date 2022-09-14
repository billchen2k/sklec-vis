import argparse


def ncf_uploader_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument('--filepath', '-f', required=True, type=str)
    parser.add_argument('--dataset', '-d', required=True)
    parser.add_argument('--destname', '-n', required=False)
    parser.add_argument('--username', '-u', default='test_lyf1')
    parser.add_argument(
        '--override',
        '-o',
        action='store_true',
        help=
        'If the dataset file with same name already exists, override the dataset file.'
    )
    return parser


def scan_parser():
    parser = argparse.ArgumentParser(description="""
    Scan autoupload folder (/home/public/sklecvis-autoupload) and upload new ncf files.
    Your file under sklecvis-autoupload must be in the format of:

        <dataset_uuid>_<file_name>.nc
    For example, file "e3d154a44_2022-09-01.nc" will be uploaded to dataset "e3d154a44" with name "2022-09-01.nc".

    """)
    parser.add_argument(
        '--override',
        '-o',
        action='store_true',
        help=
        'If the dataset file with same name already exists, override the dataset file.'
    )
    return parser
