export const exportDatabase = () => {
  const backupData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    storage: { ...localStorage }
  };
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
  const downloadAnchor = document.createElement('a');
  const dzisiaj = new Date().toISOString().split('T')[0];
  
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `centrum_dowodzenia_backup_${dzisiaj}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

export const importDatabase = (file, onSuccess) => {
  if (!file) return;
  const fileReader = new FileReader();
  fileReader.onload = () => {
    try {
      const importedData = JSON.parse(fileReader.result);
      if (window.confirm('Czy na pewno chcesz nadpisać obecne dane danymi z pliku?')) {
        if (importedData.storage) {
          Object.keys(importedData.storage).forEach(key => {
            localStorage.setItem(key, importedData.storage[key]);
          });
        }
        alert('Wszystkie dane zostały pomyślnie zaimportowane! Strona zostanie odświeżona.');
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      alert('Błąd odczytu pliku JSON! Upewnij się, że plik jest prawidłową kopią zapasową Centrum Dowodzenia.');
    }
  };
  fileReader.readAsText(file);
};