/**
 * Notification Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 */

import { FjnError, FjnErrorContext } from '../errors';

export const NOTIFICATION_ERROR_CODES = {
  TYPE_INVALID: 'NOTIFICATION_TYPE_INVALID',
  CHANNEL_INVALID: 'NOTIFICATION_CHANNEL_INVALID',
  PRIORITY_INVALID: 'NOTIFICATION_PRIORITY_INVALID',
  STATUS_INVALID: 'NOTIFICATION_STATUS_INVALID',
  USER_ID_REQUIRED: 'NOTIFICATION_USER_ID_REQUIRED',
  TITLE_REQUIRED: 'NOTIFICATION_TITLE_REQUIRED',
  CONTENT_REQUIRED: 'NOTIFICATION_CONTENT_REQUIRED',
  CHANNELS_REQUIRED: 'NOTIFICATION_CHANNELS_REQUIRED',
  CHANNEL_DUPLICATE: 'NOTIFICATION_CHANNEL_DUPLICATE',
  NOT_FOUND: 'NOTIFICATION_NOT_FOUND',
  ALREADY_READ: 'NOTIFICATION_ALREADY_READ',
  NOT_OWNER: 'NOTIFICATION_NOT_OWNER',
  TEMPLATE_NOT_FOUND: 'NOTIFICATION_TEMPLATE_NOT_FOUND',
  TEMPLATE_RENDER_FAILED: 'NOTIFICATION_TEMPLATE_RENDER_FAILED',
  VARIABLE_MISSING: 'NOTIFICATION_VARIABLE_MISSING',
  CHANNEL_DISPATCH_FAILED: 'NOTIFICATION_CHANNEL_DISPATCH_FAILED',
  PREFERENCE_DISABLED: 'NOTIFICATION_PREFERENCE_DISABLED',
  PREFERENCE_INVALID: 'NOTIFICATION_PREFERENCE_INVALID',
  RATE_LIMIT_EXCEEDED: 'NOTIFICATION_RATE_LIMIT_EXCEEDED',
  BATCH_TOO_LARGE: 'NOTIFICATION_BATCH_TOO_LARGE',
  READ_ALL_FAILED: 'NOTIFICATION_READ_ALL_FAILED',
  RETRY_EXHAUSTED: 'NOTIFICATION_RETRY_EXHAUSTED',
  EXPIRED: 'NOTIFICATION_EXPIRED',
} as const;

export type FjnNotificationErrorCode =
  (typeof NOTIFICATION_ERROR_CODES)[keyof typeof NOTIFICATION_ERROR_CODES];

export class FjnNotificationError extends FjnError {
  constructor(
    code: FjnNotificationErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnNotificationError';
  }
}

export class NotificationTypeInvalidError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(NOTIFICATION_ERROR_CODES.TYPE_INVALID, 'Notification type is invalid', context, 400);
  }
}
export class NotificationChannelInvalidError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.CHANNEL_INVALID,
      'Notification channel is invalid',
      context,
      400,
    );
  }
}
export class NotificationPriorityInvalidError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.PRIORITY_INVALID,
      'Notification priority is invalid',
      context,
      400,
    );
  }
}
export class NotificationStatusInvalidError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.STATUS_INVALID,
      'Notification status is invalid',
      context,
      409,
    );
  }
}
export class NotificationUserIdRequiredError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.USER_ID_REQUIRED,
      'Notification userId is required',
      context,
      400,
    );
  }
}
export class NotificationTitleRequiredError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.TITLE_REQUIRED,
      'Notification title is required',
      context,
      400,
    );
  }
}
export class NotificationContentRequiredError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.CONTENT_REQUIRED,
      'Notification content is required',
      context,
      400,
    );
  }
}
export class NotificationChannelsRequiredError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.CHANNELS_REQUIRED,
      'At least one channel is required',
      context,
      400,
    );
  }
}
export class NotificationChannelDuplicateError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.CHANNEL_DUPLICATE,
      'Duplicate channel in the same notification',
      context,
      400,
    );
  }
}
export class NotificationNotFoundError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(NOTIFICATION_ERROR_CODES.NOT_FOUND, 'Notification not found', context, 404);
  }
}
export class NotificationAlreadyReadError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.ALREADY_READ,
      'Notification is already read',
      context,
      409,
    );
  }
}
export class NotificationNotOwnerError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.NOT_OWNER,
      'User is not the owner of this notification',
      context,
      403,
    );
  }
}
export class NotificationTemplateNotFoundError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.TEMPLATE_NOT_FOUND,
      'Notification template not found',
      context,
      404,
    );
  }
}
export class NotificationTemplateRenderFailedError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.TEMPLATE_RENDER_FAILED,
      'Failed to render notification template',
      context,
      500,
    );
  }
}
export class NotificationVariableMissingError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.VARIABLE_MISSING,
      'Required template variable is missing',
      context,
      400,
    );
  }
}
export class NotificationChannelDispatchFailedError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.CHANNEL_DISPATCH_FAILED,
      'Failed to dispatch notification via channel',
      context,
      502,
    );
  }
}
export class NotificationPreferenceDisabledError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.PREFERENCE_DISABLED,
      'User has disabled this notification channel',
      context,
      403,
    );
  }
}
export class NotificationPreferenceInvalidError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.PREFERENCE_INVALID,
      'Notification preference is invalid',
      context,
      400,
    );
  }
}
export class NotificationRateLimitExceededError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.RATE_LIMIT_EXCEEDED,
      'Notification rate limit exceeded',
      context,
      429,
    );
  }
}
export class NotificationBatchTooLargeError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.BATCH_TOO_LARGE,
      'Batch size exceeds 1000 notifications',
      context,
      413,
    );
  }
}
export class NotificationReadAllFailedError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.READ_ALL_FAILED,
      'Failed to mark all notifications as read',
      context,
      500,
    );
  }
}
export class NotificationRetryExhaustedError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(
      NOTIFICATION_ERROR_CODES.RETRY_EXHAUSTED,
      'Notification retry attempts exhausted',
      context,
      500,
    );
  }
}
export class NotificationExpiredError extends FjnNotificationError {
  constructor(context?: FjnErrorContext) {
    super(NOTIFICATION_ERROR_CODES.EXPIRED, 'Notification is expired', context, 410);
  }
}
