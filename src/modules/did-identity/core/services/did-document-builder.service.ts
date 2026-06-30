import { Did, DidDocument, VerificationMethod, Service, VerificationRelationship } from '@/modules/did-identity/shared/types';
import { DidParserService } from './did-parser.service';
import { InvalidDocumentError, MissingRequiredFieldError } from '@/modules/did-identity/shared/errors';

export class DidDocumentBuilderService {
  private parser: DidParserService;

  constructor(parser: DidParserService) {
    this.parser = parser;
  }

  build(did: Did, verificationMethods: VerificationMethod[]): DidDocument {
    if (!did || !verificationMethods || verificationMethods.length === 0) {
      throw new MissingRequiredFieldError('did or verificationMethods');
    }

    const id = did;
    const context = 'https://www.w3.org/ns/did/v1';

    return {
      id,
      '@context': context,
      verificationMethod: verificationMethods,
      authentication: [],
      assertionMethod: [],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [],
    };
  }

  addVerificationMethod(document: DidDocument, method: VerificationMethod): DidDocument {
    if (!method.id || !method.type || !method.controller || !method.publicKeyBase58) {
      throw new MissingRequiredFieldError('verification method fields');
    }

    if (!document.verificationMethod) {
      document.verificationMethod = [];
    }

    const existing = document.verificationMethod.find(m => m.id === method.id);
    if (existing) {
      document.verificationMethod = document.verificationMethod.map(m => 
        m.id === method.id ? method : m
      );
    } else {
      document.verificationMethod.push(method);
    }

    return document;
  }

  removeVerificationMethod(document: DidDocument, methodId: string): DidDocument {
    if (!document.verificationMethod) {
      return document;
    }

    document.verificationMethod = document.verificationMethod.filter(m => m.id !== methodId);
    
    const relationships: VerificationRelationship[] = [
      'authentication',
      'assertionMethod',
      'keyAgreement',
      'capabilityInvocation',
      'capabilityDelegation',
    ];

    for (const rel of relationships) {
      if (document[rel]) {
        document[rel] = document[rel].filter(id => id !== methodId);
      }
    }

    return document;
  }

  addService(document: DidDocument, service: Service): DidDocument {
    if (!service.id || !service.type || !service.serviceEndpoint) {
      throw new MissingRequiredFieldError('service fields');
    }

    if (!document.service) {
      document.service = [];
    }

    const existing = document.service.find(s => s.id === service.id);
    if (existing) {
      document.service = document.service.map(s => s.id === service.id ? service : s);
    } else {
      document.service.push(service);
    }

    return document;
  }

  removeService(document: DidDocument, serviceId: string): DidDocument {
    if (!document.service) {
      return document;
    }

    document.service = document.service.filter(s => s.id !== serviceId);
    return document;
  }

  addVerificationRelationship(
    document: DidDocument,
    relationship: VerificationRelationship,
    methodId: string
  ): DidDocument {
    if (!document.verificationMethod?.find(m => m.id === methodId)) {
      throw new InvalidDocumentError(`Verification method not found: ${methodId}`);
    }

    if (!document[relationship]) {
      document[relationship] = [];
    }

    if (!document[relationship].includes(methodId)) {
      document[relationship].push(methodId);
    }

    return document;
  }

  removeVerificationRelationship(
    document: DidDocument,
    relationship: VerificationRelationship,
    methodId: string
  ): DidDocument {
    if (!document[relationship]) {
      return document;
    }

    document[relationship] = document[relationship].filter(id => id !== methodId);
    return document;
  }

  isValid(document: DidDocument): boolean {
    if (!document.id) return false;
    if (!document['@context']) return false;
    if (!document.verificationMethod || document.verificationMethod.length === 0) return false;

    for (const method of document.verificationMethod) {
      if (!method.id || !method.type || !method.controller || !method.publicKeyBase58) {
        return false;
      }
    }

    return true;
  }

  toJson(document: DidDocument): string {
    return JSON.stringify(document, null, 2);
  }

  fromJson(json: string): DidDocument {
    try {
      const document = JSON.parse(json);
      
      if (!this.isValid(document)) {
        throw new InvalidDocumentError('Invalid DID document');
      }

      return document;
    } catch (error) {
      throw new InvalidDocumentError('Invalid JSON');
    }
  }

  clone(document: DidDocument): DidDocument {
    return JSON.parse(JSON.stringify(document));
  }
}