'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  CreateChatRequestSchema,
  CreateChatResponseSchema,
  type CreateChatRequest,
  type CreateChatResponse,
} from '../lib/dto';

const createChatRoom = async (
  params: CreateChatRequest
): Promise<CreateChatResponse> => {
  try {
    const validated = CreateChatRequestSchema.parse(params);
    const { data } = await apiClient.post('/api/chat-rooms/create', validated);
    return CreateChatResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to create chat room');
    throw new Error(message);
  }
};

export const useCreateChatMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createChatRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatRooms'] });
    },
  });
};
