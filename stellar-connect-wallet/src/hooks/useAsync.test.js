import { renderHook, act } from '@testing-library/react';
import { useAsync, useDebounce, useForm, useLocalStorage } from '../hooks/useAsync';

describe('useAsync Hook', () => {
  it('should initialize with loading false and no data', () => {
    const asyncFn = jest.fn(async () => 'result');
    const { result } = renderHook(() => useAsync(asyncFn, []));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('should handle successful async operations', async () => {
    const asyncFn = jest.fn(async () => 'result');
    const { result } = renderHook(() => useAsync(asyncFn, []));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('result');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle async errors', async () => {
    const error = new Error('Test error');
    const asyncFn = jest.fn(async () => {
      throw error;
    });
    const { result } = renderHook(() => useAsync(asyncFn, []));

    await act(async () => {
      try {
        await result.current.execute();
      } catch (e) {
        // Error is expected
      }
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toEqual(error);
  });

  it('should reset state', async () => {
    const asyncFn = jest.fn(async () => 'result');
    const { result } = renderHook(() => useAsync(asyncFn, []));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.data).toBe('result');

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('useDebounce Hook', () => {
  jest.useFakeTimers();

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should use default delay of 500ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });
});

describe('useForm Hook', () => {
  it('should initialize with initial values', () => {
    const validate = jest.fn(() => ({}));
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues, validate));

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });

  it('should handle form value changes', () => {
    const validate = jest.fn(() => ({}));
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues, validate));

    const event = {
      target: { name: 'name', value: 'John' },
    };

    act(() => {
      result.current.handleChange(event);
    });

    expect(result.current.values.name).toBe('John');
  });

  it('should validate on form submission', async () => {
    const validate = jest.fn((values) => {
      const errors = {};
      if (!values.name) errors.name = 'Name is required';
      return errors;
    });
    const onSubmit = jest.fn();
    const initialValues = { name: '' };
    const { result } = renderHook(() => useForm(initialValues, validate));

    await act(async () => {
      const handler = result.current.handleSubmit(onSubmit);
      await handler({ preventDefault: jest.fn() });
    });

    expect(validate).toHaveBeenCalled();
    expect(result.current.errors.name).toBe('Name is required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('should reset form state', () => {
    const validate = jest.fn(() => ({}));
    const initialValues = { name: '', email: '' };
    const { result } = renderHook(() => useForm(initialValues, validate));

    act(() => {
      result.current.setValues({ name: 'John', email: 'john@example.com' });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.values).toEqual(initialValues);
    expect(result.current.errors).toEqual({});
    expect(result.current.touched).toEqual({});
  });
});

describe('useLocalStorage Hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with initial value', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));
    expect(result.current[0]).toBe('initial');
  });

  it('should persist value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorage.getItem('key')).toBe(JSON.stringify('updated'));
  });

  it('should retrieve persisted value', () => {
    localStorage.setItem('key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    expect(result.current[0]).toBe('stored');
  });

  it('should handle complex objects', () => {
    const obj = { id: 1, name: 'Test' };
    const { result } = renderHook(() => useLocalStorage('key', {}));

    act(() => {
      result.current[1](obj);
    });

    expect(JSON.parse(localStorage.getItem('key'))).toEqual(obj);
  });

  it('should handle errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useLocalStorage('key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
