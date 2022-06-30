import './App.css';
import { useState } from 'react';
import {Layout, Header, Footer } from './components/layout';
import { Form } from './components/form';
import { Results } from './components/results';
import { ChoiceScarfContextProvider } from './context/choicescarfContext';


function App() {
  const [resultsDisplayed, setResultsDisplayed] = useState(false);

  const handleResultsVisibility = () => {
    setResultsDisplayed(true);
  }

  return (
    <Layout>
      <ChoiceScarfContextProvider>
        <Form handleResultsVisibility={handleResultsVisibility} resultsVisible={resultsDisplayed}>
          <Header />
        </Form>
        <Results visible={resultsDisplayed} />
      </ChoiceScarfContextProvider>
      <Footer />
    </Layout>
  );
}

export default App;
