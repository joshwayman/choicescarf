import { render, screen, fireEvent } from '@testing-library/react';
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
