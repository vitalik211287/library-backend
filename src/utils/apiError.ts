type ApiErrorData = {
  message?: string;
  errors?: {
    fieldErrors?: Record<string, string[]>;
  };
};

export const getApiErrorMessage = async (
  response: Response,
): Promise<string> => {
  let data: ApiErrorData;

  try {
    data = (await response.json()) as ApiErrorData;
  } catch {
    return "Помилка сервера";
  }

  if (response.status === 409) {
    return "Ця книга вже є в бібліотеці";
  }

  if (response.status === 400) {
    const isbnError = data.errors?.fieldErrors?.isbn;

    if (isbnError?.[0]) {
      return isbnError[0];
    }

    return data.message ?? "Некоректні дані";
  }

  if (response.status === 404) {
    return "Книгу не знайдено";
  }

  if (response.status >= 500) {
    return "Помилка сервера";
  }

  return data.message ?? "Сталася помилка";
};