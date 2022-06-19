import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux';
import type {RootState, AppDispatch} from '@/store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export function useToken() {
  const token = useAppSelector((state) => state.auth.accessToken);
  return token;
}

export function useUser() {
  const user = useAppSelector((state) => state.auth.userobj);
  return user;
}
