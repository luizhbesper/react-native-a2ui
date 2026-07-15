import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

// Pipeline sanity: proves Jest + RNTL render RN components. Replaced by real component tests in M1.
describe('jest + react-native-testing-library pipeline', () => {
  it('renders a native Text', async () => {
    const { getByText } = await render(<Text>a2ui</Text>);
    expect(getByText('a2ui')).toBeTruthy();
  });
});
