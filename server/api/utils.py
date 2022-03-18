from typing import List

import numpy as np

def downsample1d(array: List, target_size):
    """
    Downsample 1D array to target size. May not be perfect.
    :param array:
    :param target_size:
    :return:
    """
    if target_size > len(array):
        return array
    if len(array) / target_size > 2:
        distance = len(array) // target_size
        return array[::distance]
    else:
        return array