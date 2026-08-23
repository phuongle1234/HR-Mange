import { ResponseHelper } from '../response.helper';

describe('ResponseHelper', () => {
  it('builds the { success, message, data, meta } envelope (success path)', () => {
    const result = ResponseHelper.success({ data: { id: '1' }, message: 'OK', meta: { page: 1 } });

    expect(result).toEqual({ success: true, message: 'OK', data: { id: '1' }, meta: { page: 1 } });
  });

  it('defaults meta to null when not provided (failure/edge path)', () => {
    const result = ResponseHelper.success({ data: null, message: 'Deleted.' });

    expect(result).toEqual({ success: true, message: 'Deleted.', data: null, meta: null });
  });
});
