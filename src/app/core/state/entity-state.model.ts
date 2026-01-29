export type LoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface EntityState<T> {
  status: LoadStatus;
  data: T[];
  error: string | null;
}

export const initialEntityState = <T>(): EntityState<T> => ({
  status: 'idle',
  data: [],
  error: null,
});
