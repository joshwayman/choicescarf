import { render, screen, fireEvent, within } from '@testing-library/react';
import App from './App';

test('calculates the speed to beat and shows results', async () => {
  const { container } = render(<App />);

  // The form renders "Pokemon speed to beat" first, then "Your Pokemon".
  const [toBeatBase, yourBase] = screen.getAllByLabelText(/base speed/i);
  fireEvent.change(toBeatBase, { target: { value: '100' } });
  fireEvent.change(yourBase, { target: { value: '100' } });

  fireEvent.click(screen.getByRole('button', { name: 'Go' }));

  // Base 100, 31 IV, 252 EV, neutral, Lv 50 = 152
  expect(await screen.findByText(/speed to beat is 152/i)).toBeInTheDocument();

  // One bar per nature (negative / neutral / positive); positive outspeeds so no Scarf rows
  expect(container.querySelectorAll('.chart .line')).toHaveLength(3);
});

test('clamps out-of-range values when calculating', async () => {
  render(<App />);

  const [toBeatBase, yourBase] = screen.getAllByLabelText(/base speed/i);
  fireEvent.change(toBeatBase, { target: { value: '100' } });
  fireEvent.change(yourBase, { target: { value: '100' } });
  const evs = screen.getByLabelText(/^evs$/i);
  fireEvent.change(evs, { target: { value: '300' } });

  fireEvent.click(screen.getByRole('button', { name: 'Go' }));

  // 300 EVs is treated as 252, so the target is still 152, and the form shows 252.
  expect(await screen.findByText(/speed to beat is 152/i)).toBeInTheDocument();
  expect(evs).toHaveValue(252);
});

test('lets a field be cleared while typing and resets it on blur', () => {
  render(<App />);

  const [toBeatLevel] = screen.getAllByLabelText(/level/i);
  fireEvent.change(toBeatLevel, { target: { value: '' } });
  expect(toBeatLevel).toHaveValue(null);

  fireEvent.blur(toBeatLevel);
  expect(toBeatLevel).toHaveValue(50);
});

test('has no duplicate element ids', () => {
  const { container } = render(<App />);
  const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
  expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
});

test('nature options are radio buttons in labelled groups', () => {
  render(<App />);
  const groups = screen.getAllByRole('radiogroup', { name: 'Nature' });
  expect(groups).toHaveLength(2);

  fireEvent.click(within(groups[1]).getByRole('radio', { name: 'Positive' }));
  expect(within(groups[1]).getByRole('radio', { name: 'Positive' })).toBeChecked();
});

test('the notification can be dismissed with a labelled button', async () => {
  window.localStorage.clear();
  render(<App />);
  // The notification slides in about a second after load.
  const dismiss = await screen.findByRole('button', { name: /dismiss notification/i }, { timeout: 3000 });
  fireEvent.click(dismiss);
  expect(window.localStorage.getItem('updatedMessage')).toBe('true');
});

test('the results panel toggle has an accessible name', async () => {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Go' }));
  const toggle = await screen.findByRole('button', { name: /collapse results/i });
  expect(toggle).toHaveAttribute('aria-expanded', 'true');

  fireEvent.click(toggle);
  expect(screen.getByRole('button', { name: /expand results/i })).toHaveAttribute('aria-expanded', 'false');
});
