import { Request, Response } from 'express';
import { mockStore } from '../models/mockStore';
import { successResponse } from '../utils/response';

export const syncSalesforce = async (_req: Request, res: Response): Promise<void> => {
  mockStore.salesforceStatus = {
    ...mockStore.salesforceStatus,
    status: 'SYNCING',
    lastSyncedAt: new Date().toISOString(),
  };

  setTimeout(() => {
    mockStore.salesforceStatus.status = 'IDLE';
    mockStore.salesforceStatus.syncedRecords += Math.floor(Math.random() * 25) + 5;
  }, 2000);

  successResponse(
    res,
    mockStore.salesforceStatus,
    'Salesforce integration synchronization triggered successfully'
  );
};

export const getSalesforceStatus = async (_req: Request, res: Response): Promise<void> => {
  successResponse(res, mockStore.salesforceStatus, 'Salesforce integration status retrieved');
};

export const syncHubspot = async (_req: Request, res: Response): Promise<void> => {
  mockStore.hubspotStatus = {
    ...mockStore.hubspotStatus,
    status: 'SYNCING',
    lastSyncedAt: new Date().toISOString(),
  };

  setTimeout(() => {
    mockStore.hubspotStatus.status = 'IDLE';
    mockStore.hubspotStatus.syncedSubmissions += Math.floor(Math.random() * 40) + 10;
  }, 2000);

  successResponse(
    res,
    mockStore.hubspotStatus,
    'HubSpot integration synchronization triggered successfully'
  );
};

export const getHubspotStatus = async (_req: Request, res: Response): Promise<void> => {
  successResponse(res, mockStore.hubspotStatus, 'HubSpot integration status retrieved');
};
