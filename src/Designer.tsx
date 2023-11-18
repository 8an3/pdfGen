import { useEffect, useRef, useState } from "react";
import { Designer, Template, checkTemplate } from "@pdfme/ui";
import { generate } from "@pdfme/generator";
import {
  getFontsData,
  getTemplate,
  readFile,
  cloneDeep,
  getTemplateFromJsonFile,
  downloadJsonFile,
} from "./helper";
import fs from 'fs';

const fileNames = ['bosSchema.json', 'ucdaSchema.json'];

function App() {
  const designerRef = useRef<HTMLDivElement | null>(null);
  const designer = useRef<Designer | null>(null);

  useEffect(() => {
    let template: Template = getTemplate();
    try {
      const templateString = localStorage.getItem("template");
      const templateJson = templateString
        ? JSON.parse(templateString)
        : getTemplate();
      checkTemplate(templateJson);
      template = templateJson as Template;
    } catch {
      localStorage.removeItem("template");
    }

    getFontsData().then((font) => {
      if (designerRef.current) {
        designer.current = new Designer({
          domContainer: designerRef.current,
          template,
          options: { font },
        });
        designer.current.onSaveTemplate(onSaveTemplate);
      }
    });
    return () => {
      if (designer.current) {
        designer.current.destroy();
      }
    };
  }, [designerRef]);

  const onChangeBasePDF = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target && e.target.files) {
      readFile(e.target.files[0], "dataURL").then(async (basePdf) => {
        if (designer.current) {
          designer.current.updateTemplate(
            Object.assign(cloneDeep(designer.current.getTemplate()), {
              basePdf,
            })
          );
        }
      });
    }
  };

  const onDownloadTemplate = () => {
    if (designer.current) {
      downloadJsonFile(designer.current.getTemplate(), "template");
    }
  };

  const onResetTemplate = () => {
    if (designer.current) {
      designer.current.updateTemplate(getTemplate());
      localStorage.removeItem("template");
    }
  };

  const onGeneratePDF = async () => {
    if (designer.current) {
      const template = designer.current.getTemplate();
      const inputs = template.sampledata ?? [];
      const font = await getFontsData();
      const pdf = await generate({ template, inputs, options: { font } });
      const blob = new Blob([pdf.buffer], { type: "application/pdf" });
      window.open(URL.createObjectURL(blob));
    }
  };

  const onLoadTemplate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target && e.target.files) {
      getTemplateFromJsonFile(e.target.files[0])
        .then((t) => {
          if (designer.current) {
            designer.current.updateTemplate(t);
          }
        })
        .catch((e) => {
          alert(`Invalid template file.
--------------------------
${e}`);
        });
    }
  };

  const [selectedFile, setSelectedFile] = useState('');
  const [saveMyDoc, setSaveMyDoc] = useState();


  const onLoadPreTemplate = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const fileName = event.target.value;
    setSelectedFile(fileName);

    fetch(`http://localhost:3000/schemas/${fileName}`)
      .then(response => response.text())
      .then(data => {
        const blob = new Blob([data], { type: 'application/json' });
        getTemplateFromJsonFile(blob)
          .then((t) => {
            if (designer.current) {
              designer.current.updateTemplate(t);
              setSaveMyDoc(t)
            }
          })
          .catch((e) => {
            alert(`Invalid template file.
--------------------------
${e}`);
          });
      })
      .catch(error => console.error('Error:', error));
  };

  const onSaveTemplate = (template?: Template) => {
    if (designer.current) {
      localStorage.setItem("doc", JSON.stringify(template || designer.current.getTemplate()));
     const data = JSON.stringify(template || designer.current.getTemplate());
     console.log(data)
      fetch('http://localhost:3000/pdt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then((response) => {
          console.log(`${response.url}: ${response.status}`);
        })
        .catch((error) => {
          console.error(`Failed to fetch: ${error}`);
        });
  }
  }
  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <strong>Designer</strong>
        <span style={{ margin: "0 1rem" }}>:</span>
        <label style={{ width: 180 }}>
          Change BasePDF
          <input
            type="file"
            accept="application/pdf"
            onChange={onChangeBasePDF}
          />
        </label>
        <span style={{ margin: "0 1rem" }}>/</span>
        <label style={{ width: 180 }}>
          Load Template
          <input
            type="file"
            accept="application/json"
            onChange={onLoadTemplate}
          />
        </label>

        <select value={selectedFile} onChange={onLoadPreTemplate}>
          <option value="">Select a file</option>
          {fileNames.map((fileName) => (
            <option key={fileName} value={fileName}>{fileName}</option>
          ))}
        </select>
        <span style={{ margin: "0 1rem" }}>/</span>
        <button onClick={onDownloadTemplate}>Download Template</button>
        <span style={{ margin: "0 1rem" }}>/</span>
        <button onClick={() => onSaveTemplate()}>Save Template</button>
        <span style={{ margin: "0 1rem" }}>/</span>
        <button onClick={onResetTemplate}>Reset Template</button>
        <span style={{ margin: "0 1rem" }}>/</span>
        <button onClick={onGeneratePDF}>Generate PDF</button>
      </header>
      <div ref={designerRef} />
    </div>
  );
}

export default App;
