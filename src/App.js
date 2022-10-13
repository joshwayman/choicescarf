import './App.css';
import { useState } from 'react';
import {Layout, Header, Footer } from './components/layout';
import { Form } from './components/form';
import { Results } from './components/results';
import { ChoiceScarfContextProvider } from './context/choicescarfContext';
import { SideNotification } from './components/notification';


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
      {/*<SideNotification title="So I updated everything" text="I hope you enjoy it." />*/}
    </Layout>
  );
}

export default App;
