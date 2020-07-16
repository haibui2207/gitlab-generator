import React, { useMemo, useState } from 'react';
import { Button, Form, FormGroup, Label, Input } from 'reactstrap';

import { setData } from './services/localstorage';
import generateReleaseNotes from './services/generateReleaseNotes';
import styles from './app.module.scss';

const App = () => {
  const [isGenerating, setGenerateStatus] = useState(false);
  const [formValues, setFormValues] = useState({
    gitlabEndPoint: 'https://gitlab.com/api/v4',
    projectId: '16568354',
    targetBranch: 'stag',
    tagRegex: '^v.*$',
    accessToken: 'qx6aKMmkzd-TuuLgtWHr',
    timeZone: 'America/New_York',
    issueCloseSecond: '0',
  });

  const formConfig = useMemo(
    () => [
      { name: 'gitlabEndPoint', label: 'Gitlab Endpoint', hidden: true },
      { name: 'projectId', label: 'Project ID' },
      { name: 'targetBranch', label: 'Target Branch' },
      { name: 'tagRegex', label: 'Tag regex', placeholder: '^release.*$' },
      { name: 'accessToken', label: 'Access Token' },
      { name: 'timeZone', label: 'TimeZone', placeholder: 'America/New_York' },
      { name: 'issueCloseSecond', label: 'Issue Close Second', hidden: true },
    ],
    [],
  );

  const handleInputChange = ({ target: { name, value } }) => {
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = async () => {
    setData(formValues);
    setGenerateStatus(true);
    try {
      await generateReleaseNotes();
    } catch (e) {
      console.log(e);
    } finally {
      setGenerateStatus(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Gitlab generator Release Notes</h1>
      <Form className={styles.form}>
        {formConfig.filter(item => !item.hidden).map((item) => (
          <FormGroup key={item.name}>
            <Label for={item.name}>{item.label}</Label>
            <Input
              placeholder={`Input your ${item.label}`}
              id={item.name}
              onChange={handleInputChange}
              value={formValues[item.name]}
              disabled={isGenerating}
              {...item}
            />
          </FormGroup>
        ))}

        <Button
          onClick={handleSubmit}
          disabled={isGenerating}
          style={{ cursor: isGenerating ? 'progress' : 'pointer' }}
        >
          {isGenerating ? 'Generating' : 'Start generate'}
        </Button>
      </Form>
    </div>
  );
};

export default App;
