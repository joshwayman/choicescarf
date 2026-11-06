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
  // eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
  expect(container.querySelectorAll('.chart .line')).toHaveLength(3);
});
