def readable_size(num, suffix='B'):
    """
    Get readable size from bytes number.
    :param num: The size of file in bytes.
    :param suffix:  The suffix to add to the final results.
    :return: Human readable file size.
    """
    for unit in ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z']:
        if abs(num) < 1024.0:
            return f'{num:3.1f}{unit}{suffix}'
        num /= 1024.0
    return f'{num:.1f}Yi{suffix}'