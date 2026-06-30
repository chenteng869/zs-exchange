import { DidParserService } from '../services/did-parser.service';
import { DidDocumentBuilderService } from '../services/did-document-builder.service';
import { KeyManagerService } from '../services/key-manager.service';
import { DidGeneratorService } from '../services/did-generator.service';
import { DidResolverService } from '../services/did-resolver.service';
import { DidAuditService } from '../services/did-audit.service';
import { AnchorHashService } from '../services/anchor-hash.service';
import { DidMethodRegistryService } from './did-method-registry.service';

export interface DidRuntime {
  parser: DidParserService;
  documentBuilder: DidDocumentBuilderService;
  keyManager: KeyManagerService;
  generator: DidGeneratorService;
  resolver: DidResolverService;
  audit: DidAuditService;
  anchorHash: AnchorHashService;
  methodRegistry: DidMethodRegistryService;
}

export const createDidRuntime = (): DidRuntime => {
  const parser = new DidParserService();
  const documentBuilder = new DidDocumentBuilderService(parser);
  const keyManager = new KeyManagerService();
  const generator = new DidGeneratorService(parser, documentBuilder, keyManager);
  const resolver = new DidResolverService(parser);
  const audit = new DidAuditService();
  const anchorHash = new AnchorHashService();
  const methodRegistry = new DidMethodRegistryService();

  return {
    parser,
    documentBuilder,
    keyManager,
    generator,
    resolver,
    audit,
    anchorHash,
    methodRegistry,
  };
};

export const didRuntime = createDidRuntime();