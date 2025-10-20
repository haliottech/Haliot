import { supabase } from "@/integrations/supabase/client";

export const createNotification = async (
  userId: string,
  type: 'like' | 'message' | 'comment',
  content: string,
  relatedUserId?: string,
  relatedPostId?: string,
  relatedMessageId?: string
) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        content,
        related_user_id: relatedUserId,
        related_post_id: relatedPostId,
        related_message_id: relatedMessageId,
      });

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (err) {
    console.error('Unexpected error creating notification:', err);
  }
};

export const createLikeNotification = async (
  postOwnerId: string,
  likerName: string,
  postId: string,
  likerId: string
) => {
  await createNotification(
    postOwnerId,
    'like',
    `${likerName} liked your post`,
    likerId,
    postId
  );
};

export const createMessageNotification = async (
  recipientId: string,
  senderName: string,
  messageId: string,
  senderId: string
) => {
  await createNotification(
    recipientId,
    'message',
    `${senderName} sent you a message`,
    senderId,
    undefined,
    messageId
  );
};