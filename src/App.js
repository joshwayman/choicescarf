import './App.css';

import {Layout, Header, Footer } from './components/layout';
import { Form } from './components/form';
import { Results } from './components/results';
import { ChoiceScarfContextProvider } from './context/choicescarfContext';


function App() {
  return (
    <Layout>
      <ChoiceScarfContextProvider>
        <Form>
          <Header />
        </Form>
        <Results />
      </ChoiceScarfContextProvider>
      <Footer />
    </Layout>
  );
}

export default App;
