import type { ComponentRegistry } from '../renderer/registry';
import { Card, Column, Divider, List, Row } from './layout';

export { Card, Column, Divider, List, Row } from './layout';

/** The basic catalog registry: node `component` type → its renderer. Grows per M1 session. */
export const basicCatalog: ComponentRegistry = { Row, Column, Card, Divider, List };
