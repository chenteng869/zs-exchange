/**
 * Approval Service - 错误码 + 异常类
 *
 * 工业级 Solana-first 架构
 */

import { FjnError, FjnErrorContext } from '../errors';

export const APPROVAL_ERROR_CODES = {
  REQUEST_NOT_FOUND: 'APPROVAL_REQUEST_NOT_FOUND',
  REQUEST_TYPE_INVALID: 'APPROVAL_REQUEST_TYPE_INVALID',
  REQUEST_STATUS_INVALID: 'APPROVAL_REQUEST_STATUS_INVALID',
  REQUEST_ALREADY_DECIDED: 'APPROVAL_REQUEST_ALREADY_DECIDED',
  REQUEST_EXPIRED: 'APPROVAL_REQUEST_EXPIRED',
  REQUEST_NOT_PENDING: 'APPROVAL_REQUEST_NOT_PENDING',
  REQUEST_NOT_APPROVABLE: 'APPROVAL_REQUEST_NOT_APPROVABLE',
  REQUEST_NOT_REJECTABLE: 'APPROVAL_REQUEST_NOT_REJECTABLE',
  REQUEST_NOT_CANCELLABLE: 'APPROVAL_REQUEST_NOT_CANCELLABLE',
  REQUEST_NOT_EXECUTABLE: 'APPROVAL_REQUEST_NOT_EXECUTABLE',
  REQUEST_EXECUTED: 'APPROVAL_REQUEST_EXECUTED',
  STEP_NOT_FOUND: 'APPROVAL_STEP_NOT_FOUND',
  STEP_STATUS_INVALID: 'APPROVAL_STEP_STATUS_INVALID',
  STEP_ALREADY_DECIDED: 'APPROVAL_STEP_ALREADY_DECIDED',
  STEP_NOT_CURRENT: 'APPROVAL_STEP_NOT_CURRENT',
  APPROVER_REQUIRED: 'APPROVAL_APPROVER_REQUIRED',
  APPROVER_DUPLICATE: 'APPROVAL_APPROVER_DUPLICATE',
  APPROVER_NOT_AUTHORIZED: 'APPROVAL_APPROVER_NOT_AUTHORIZED',
  APPLICANT_REQUIRED: 'APPROVAL_APPLICANT_REQUIRED',
  APPLICANT_TYPE_INVALID: 'APPROVAL_APPLICANT_TYPE_INVALID',
  TITLE_REQUIRED: 'APPROVAL_TITLE_REQUIRED',
  PAYLOAD_REQUIRED: 'APPROVAL_PAYLOAD_REQUIRED',
  PRIORITY_INVALID: 'APPROVAL_PRIORITY_INVALID',
  EXPIRES_AT_INVALID: 'APPROVAL_EXPIRES_AT_INVALID',
  TOTAL_STEPS_INVALID: 'APPROVAL_TOTAL_STEPS_INVALID',
  CURRENT_STEP_INVALID: 'APPROVAL_CURRENT_STEP_INVALID',
  STEPS_COUNT_MISMATCH: 'APPROVAL_STEPS_COUNT_MISMATCH',
  CANNOT_APPROVE_OWN: 'APPROVAL_CANNOT_APPROVE_OWN',
  SELF_APPROVAL_FORBIDDEN: 'APPROVAL_SELF_APPROVAL_FORBIDDEN',
  CANNOT_CANCEL_OTHERS: 'APPROVAL_CANNOT_CANCEL_OTHERS',
  COMMENT_REQUIRED_FOR_REJECT: 'APPROVAL_COMMENT_REQUIRED_FOR_REJECT',
} as const;

export type FjnApprovalErrorCode =
  (typeof APPROVAL_ERROR_CODES)[keyof typeof APPROVAL_ERROR_CODES];

export class FjnApprovalError extends FjnError {
  constructor(
    code: FjnApprovalErrorCode,
    message: string,
    context?: FjnErrorContext,
    httpStatus?: number,
  ) {
    super({ code: code as any, message, context, httpStatus });
    this.name = 'FjnApprovalError';
  }
}

export class ApprovalRequestNotFoundError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.REQUEST_NOT_FOUND, 'Approval request not found', context, 404);
  }
}
export class ApprovalRequestTypeInvalidError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.REQUEST_TYPE_INVALID, 'Approval type is invalid', context, 400);
  }
}
export class ApprovalRequestStatusInvalidError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.REQUEST_STATUS_INVALID,
      'Approval request status is invalid for the action',
      context,
      409,
    );
  }
}
export class ApprovalRequestAlreadyDecidedError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.REQUEST_ALREADY_DECIDED,
      'Approval request is already decided',
      context,
      409,
    );
  }
}
export class ApprovalRequestExpiredError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.REQUEST_EXPIRED, 'Approval request is expired', context, 410);
  }
}
export class ApprovalRequestNotPendingError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.REQUEST_NOT_PENDING,
      'Approval request is not in pending state',
      context,
      409,
    );
  }
}
export class ApprovalRequestNotApprovableError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.REQUEST_NOT_APPROVABLE,
      'Approval request cannot be approved in current state',
      context,
      409,
    );
  }
}
export class ApprovalRequestNotRejectableError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.REQUEST_NOT_REJECTABLE,
      'Approval request cannot be rejected in current state',
      context,
      409,
    );
  }
}
export class ApprovalRequestNotCancellableError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.REQUEST_NOT_CANCELLABLE,
      'Approval request cannot be cancelled in current state',
      context,
      409,
    );
  }
}
export class ApprovalRequestNotExecutableError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.REQUEST_NOT_EXECUTABLE,
      'Approval request cannot be executed in current state',
      context,
      409,
    );
  }
}
export class ApprovalRequestExecutedError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.REQUEST_EXECUTED, 'Approval request is already executed', context, 409);
  }
}

export class ApprovalStepNotFoundError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.STEP_NOT_FOUND, 'Approval step not found', context, 404);
  }
}
export class ApprovalStepStatusInvalidError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.STEP_STATUS_INVALID, 'Approval step status is invalid', context, 409);
  }
}
export class ApprovalStepAlreadyDecidedError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.STEP_ALREADY_DECIDED,
      'Approval step is already decided',
      context,
      409,
    );
  }
}
export class ApprovalStepNotCurrentError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.STEP_NOT_CURRENT,
      'Approval step is not the current step',
      context,
      409,
    );
  }
}

export class ApprovalApproverRequiredError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.APPROVER_REQUIRED, 'Approver is required', context, 400);
  }
}
export class ApprovalApproverDuplicateError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.APPROVER_DUPLICATE,
      'Approver has already decided on this step',
      context,
      409,
    );
  }
}
export class ApprovalApproverNotAuthorizedError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.APPROVER_NOT_AUTHORIZED,
      'Approver is not authorized for this step',
      context,
      403,
    );
  }
}
export class ApprovalApplicantRequiredError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.APPLICANT_REQUIRED, 'Applicant is required', context, 400);
  }
}
export class ApprovalApplicantTypeInvalidError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.APPLICANT_TYPE_INVALID,
      'Applicant type is invalid',
      context,
      400,
    );
  }
}
export class ApprovalTitleRequiredError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.TITLE_REQUIRED, 'Title is required', context, 400);
  }
}
export class ApprovalPayloadRequiredError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.PAYLOAD_REQUIRED, 'Payload is required', context, 400);
  }
}
export class ApprovalPriorityInvalidError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(APPROVAL_ERROR_CODES.PRIORITY_INVALID, 'Priority is invalid', context, 400);
  }
}
export class ApprovalExpiresAtInvalidError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.EXPIRES_AT_INVALID,
      'expiresAt is invalid (must be in the future)',
      context,
      400,
    );
  }
}
export class ApprovalTotalStepsInvalidError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.TOTAL_STEPS_INVALID,
      'totalSteps is invalid (must be 1-10)',
      context,
      400,
    );
  }
}
export class ApprovalCurrentStepInvalidError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.CURRENT_STEP_INVALID,
      'currentStep is invalid',
      context,
      400,
    );
  }
}
export class ApprovalStepsCountMismatchError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.STEPS_COUNT_MISMATCH,
      'Provided steps count does not match totalSteps',
      context,
      400,
    );
  }
}
export class ApprovalCannotApproveOwnError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.CANNOT_APPROVE_OWN,
      'Applicant cannot approve their own request',
      context,
      403,
    );
  }
}
export class ApprovalSelfApprovalForbiddenError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.SELF_APPROVAL_FORBIDDEN,
      'Self-approval is forbidden by policy',
      context,
      403,
    );
  }
}
export class ApprovalCannotCancelOthersError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.CANNOT_CANCEL_OTHERS,
      'Only the applicant or admin can cancel the request',
      context,
      403,
    );
  }
}
export class ApprovalCommentRequiredForRejectError extends FjnApprovalError {
  constructor(context?: FjnErrorContext) {
    super(
      APPROVAL_ERROR_CODES.COMMENT_REQUIRED_FOR_REJECT,
      'Comment is required when rejecting',
      context,
      400,
    );
  }
}
