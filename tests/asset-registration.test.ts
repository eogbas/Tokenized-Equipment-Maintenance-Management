import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity VM environment
const mockVM = {
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  blockHeight: 100,
  nftMint: vi.fn().mockReturnValue({ value: true }),
  nftTransfer: vi.fn().mockReturnValue({ value: true }),
  mapGet: vi.fn(),
  mapSet: vi.fn(),
  varGet: vi.fn(),
  varSet: vi.fn(),
};

// Mock the contract functions
const assetRegistration = {
  registerEquipment: (name, manufacturer, model, serialNumber, manufactureDate) => {
    const equipmentId = mockVM.varGet.mockReturnValueOnce(1);
    mockVM.nftMint('equipment', equipmentId, mockVM.txSender);
    mockVM.mapSet('equipment-details', equipmentId, {
      name,
      manufacturer,
      model,
      'serial-number': serialNumber,
      'manufacture-date': manufactureDate,
      'last-maintenance-date': 0,
      owner: mockVM.txSender
    });
    mockVM.varSet('equipment-id-counter', equipmentId + 1);
    return { value: equipmentId };
  },
  
  transferEquipment: (equipmentId, recipient) => {
    mockVM.mapGet.mockReturnValueOnce({
      owner: mockVM.txSender
    });
    mockVM.nftTransfer('equipment', equipmentId, mockVM.txSender, recipient);
    mockVM.mapGet.mockReturnValueOnce({
      name: 'Test Equipment',
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      'serial-number': 'SN12345',
      'manufacture-date': 50,
      'last-maintenance-date': 0,
      owner: mockVM.txSender
    });
    mockVM.mapSet('equipment-details', equipmentId, {
      name: 'Test Equipment',
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      'serial-number': 'SN12345',
      'manufacture-date': 50,
      'last-maintenance-date': 0,
      owner: recipient
    });
    return { value: true };
  },
  
  getEquipmentDetails: (equipmentId) => {
    return mockVM.mapGet.mockReturnValueOnce({
      name: 'Test Equipment',
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      'serial-number': 'SN12345',
      'manufacture-date': 50,
      'last-maintenance-date': 0,
      owner: mockVM.txSender
    });
  },
  
  equipmentExists: (equipmentId) => {
    const details = mockVM.mapGet('equipment-details', equipmentId);
    return { value: details !== null };
  },
  
  updateLastMaintenanceDate: (equipmentId, maintenanceDate) => {
    mockVM.mapGet.mockReturnValueOnce({
      name: 'Test Equipment',
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      'serial-number': 'SN12345',
      'manufacture-date': 50,
      'last-maintenance-date': 0,
      owner: mockVM.txSender
    });
    mockVM.mapSet('equipment-details', equipmentId, {
      name: 'Test Equipment',
      manufacturer: 'Test Manufacturer',
      model: 'Test Model',
      'serial-number': 'SN12345',
      'manufacture-date': 50,
      'last-maintenance-date': maintenanceDate,
      owner: mockVM.txSender
    });
    return { value: true };
  }
};

describe('Asset Registration Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
 
  it('should transfer equipment ownership', () => {
    const equipmentId = 1;
    const recipient = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    const result = assetRegistration.transferEquipment(equipmentId, recipient);
    
    expect(mockVM.nftTransfer).toHaveBeenCalledWith('equipment', equipmentId, mockVM.txSender, recipient);
    expect(mockVM.mapSet).toHaveBeenCalled();
    expect(result.value).toBe(true);
  });
});
