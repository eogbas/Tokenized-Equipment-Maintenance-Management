import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the Clarity VM environment
const mockVM = {
  txSender: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
  blockHeight: 100,
  mapGet: vi.fn(),
  mapSet: vi.fn(),
  mapDelete: vi.fn(),
  varGet: vi.fn().mockReturnValue('ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'),
};

// Mock the contract functions
const serviceProvider = {
  isContractOwner: () => {
    return mockVM.txSender === mockVM.varGet('contract-owner');
  },
  
  addAuthorizedCertifier: (certifier) => {
    if (!serviceProvider.isContractOwner()) {
      return { error: 403 };
    }
    mockVM.mapSet('authorized-certifiers', certifier, true);
    return { value: true };
  },
  
  removeAuthorizedCertifier: (certifier) => {
    if (!serviceProvider.isContractOwner()) {
      return { error: 403 };
    }
    mockVM.mapDelete('authorized-certifiers', certifier);
    return { value: true };
  },
  
  registerServiceProvider: (provider, name, certification, specialization, certificationExpiry) => {
    mockVM.mapGet.mockReturnValueOnce(true); // Assume caller is authorized
    
    mockVM.mapSet('service-providers', provider, {
      name,
      certification,
      specialization,
      'certification-expiry': certificationExpiry,
      'is-active': true
    });
    return { value: true };
  },
  
  updateProviderStatus: (provider, isActive) => {
    mockVM.mapGet.mockReturnValueOnce(true); // Assume caller is authorized
    
    mockVM.mapGet.mockReturnValueOnce({
      name: 'Test Provider',
      certification: 'Certified Technician',
      specialization: 'HVAC',
      'certification-expiry': 500,
      'is-active': !isActive
    });
    
    mockVM.mapSet('service-providers', provider, {
      name: 'Test Provider',
      certification: 'Certified Technician',
      specialization: 'HVAC',
      'certification-expiry': 500,
      'is-active': isActive
    });
    return { value: true };
  },
  
  getServiceProvider: (provider) => {
    return mockVM.mapGet.mockReturnValueOnce({
      name: 'Test Provider',
      certification: 'Certified Technician',
      specialization: 'HVAC',
      'certification-expiry': 500,
      'is-active': true
    });
  },
  
  isVerifiedProvider: (provider) => {
    const providerDetails = mockVM.mapGet.mockReturnValueOnce({
      name: 'Test Provider',
      certification: 'Certified Technician',
      specialization: 'HVAC',
      'certification-expiry': 500,
      'is-active': true
    });
    
    return {
      value: providerDetails &&
          providerDetails['is-active'] &&
          providerDetails['certification-expiry'] > mockVM.blockHeight
    };
  }
};

describe('Service Provider Contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should add an authorized certifier', () => {
    const certifier = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    const result = serviceProvider.addAuthorizedCertifier(certifier);
    
    expect(mockVM.mapSet).toHaveBeenCalledWith('authorized-certifiers', certifier, true);
    expect(result.value).toBe(true);
  });
  
  it('should register a service provider', () => {
    const provider = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
    
    const result = serviceProvider.registerServiceProvider(
        provider,
        'Test Provider',
        'Certified Technician',
        'HVAC',
        500
    );
    
    expect(mockVM.mapSet).toHaveBeenCalled();
    expect(result.value).toBe(true);
  });
});
