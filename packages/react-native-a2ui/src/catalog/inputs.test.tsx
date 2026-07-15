import { act, fireEvent } from '@testing-library/react-native';
import { createFakeEngine, mount as mountWith } from './__fixtures__/fakeEngine';
import { basicCatalog } from './index';

function mount(fake: ReturnType<typeof createFakeEngine>) {
  return mountWith(fake, basicCatalog);
}

async function withSurface(setup: (fake: ReturnType<typeof createFakeEngine>) => void) {
  const fake = createFakeEngine();
  const screen = await mount(fake);
  await act(async () => {
    fake.createSurface();
  });
  await act(async () => {
    setup(fake);
  });
  return { fake, screen };
}

describe('inputs catalog — Button', () => {
  it('renders its child label', async () => {
    const { screen } = await withSurface((fake) => {
      fake.setNode({
        id: 'root',
        type: 'Button',
        properties: { child: 'lbl', action: { event: { name: 'go', context: {} } } },
      });
      fake.setNode({ id: 'lbl', type: 'Text', properties: { text: 'Click me' } });
    });
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('dispatches its event action with its own id as source and the context verbatim', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'Button',
        properties: {
          child: 'lbl',
          action: { event: { name: 'login', context: { user: { path: '/username' } } } },
        },
      });
      f.setNode({ id: 'lbl', type: 'Text', properties: { text: 'Sign in' } });
    });
    fireEvent.press(screen.getByRole('button'));
    // The engine resolves `{ path }` at fire time (M0-T5), so the Button forwards it raw.
    expect(fake.dispatched).toEqual([
      { name: 'login', sourceComponentId: 'root', context: { user: { path: '/username' } } },
    ]);
  });

  it('does not dispatch a server event for a client-side functionCall action', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'Button',
        properties: { child: 'lbl', action: { functionCall: { call: 'openUrl' } } },
      });
      f.setNode({ id: 'lbl', type: 'Text', properties: { text: 'Open' } });
    });
    expect(() => fireEvent.press(screen.getByRole('button'))).not.toThrow();
    expect(fake.dispatched).toEqual([]);
  });
});

describe('inputs catalog — TextField', () => {
  it('renders its label and the bound value, reacting to data writes', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'TextField',
        properties: { label: 'Username', value: { path: '/username' } },
      });
    });
    expect(screen.getByLabelText('Username')).toBeTruthy();
    await act(async () => {
      fake.writeValue('/username', 'ada');
    });
    expect(screen.getByLabelText('Username').props.value).toBe('ada');
  });

  it('writes user input back to the bound path (two-way)', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'TextField',
        properties: { label: 'Username', value: { path: '/username' } },
      });
    });
    await act(async () => {
      fireEvent.changeText(screen.getByLabelText('Username'), 'grace');
    });
    // Round-trips through the bound path: the value binding re-reads what was written.
    expect(screen.getByLabelText('Username').props.value).toBe('grace');
  });

  it('tolerates a missing/unbound value without a write path', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({ id: 'root', type: 'TextField', properties: { label: 'Name' } });
    });
    const input = screen.getByLabelText('Name');
    expect(() => fireEvent.changeText(input, 'x')).not.toThrow();
  });

  it('tolerates a null bound value', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'TextField',
        properties: { label: 'Name', value: { path: '/name' } },
      });
    });
    await act(async () => {
      fake.writeValue('/name', null);
    });
    expect(screen.toJSON()).toBeTruthy();
  });
});

describe('inputs catalog — CheckBox', () => {
  it('renders its label and reflects the bound checked state', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'CheckBox',
        properties: { label: 'Remember me', value: { path: '/remember' } },
      });
    });
    expect(screen.getByText('Remember me')).toBeTruthy();
    expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(false);
    await act(async () => {
      fake.writeValue('/remember', true);
    });
    expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(true);
  });

  it('toggles the bound value on press (two-way)', async () => {
    const { screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'CheckBox',
        properties: { label: 'Agree', value: { path: '/agree' } },
      });
    });
    const box = screen.getByRole('checkbox');
    expect(box.props.accessibilityState.checked).toBe(false);
    await act(async () => {
      fireEvent.press(box);
    });
    expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(true);
    await act(async () => {
      fireEvent.press(screen.getByRole('checkbox'));
    });
    expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(false);
  });

  it('renders unchecked for a null bound value', async () => {
    const { fake, screen } = await withSurface((f) => {
      f.setNode({
        id: 'root',
        type: 'CheckBox',
        properties: { label: 'X', value: { path: '/x' } },
      });
    });
    await act(async () => {
      fake.writeValue('/x', null);
    });
    expect(screen.getByRole('checkbox').props.accessibilityState.checked).toBe(false);
  });
});
