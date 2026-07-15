import type { ComponentRegistry } from '../renderer/registry';
import { Icon, Image, Text } from './content';
import { Button, CheckBox, ChoicePicker, DateTimeInput, Slider, TextField } from './inputs';
import { Card, Column, Divider, List, Row } from './layout';

export { Icon, Image, Text } from './content';
export { Button, CheckBox, ChoicePicker, DateTimeInput, Slider, TextField } from './inputs';
export { Card, Column, Divider, List, Row } from './layout';

/** The basic catalog registry: node `component` type → its renderer. Grows per M1 session. */
export const basicCatalog: ComponentRegistry = {
  Row,
  Column,
  Card,
  Divider,
  List,
  Text,
  Image,
  Icon,
  Button,
  TextField,
  CheckBox,
  Slider,
  ChoicePicker,
  DateTimeInput,
};
