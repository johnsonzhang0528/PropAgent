import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as any).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Customer', 'Property'],
  endpoints: (builder) => ({
    getCustomers: builder.query({
      query: () => '/customers',
      providesTags: ['Customer'],
    }),
    getProperties: builder.query({
      query: () => '/properties',
      providesTags: ['Property'],
    }),
  }),
});

export const { useGetCustomersQuery, useGetPropertiesQuery } = api;
