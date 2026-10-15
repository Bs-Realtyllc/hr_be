import { AsyncLocalStorage } from "node:async_hooks";

export interface RequestContext {
  traceId: string;
  employeeId?: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();
export const getContext = () => requestContext.getStore();