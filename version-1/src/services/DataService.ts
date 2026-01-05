import { Response, Settings } from '../types';

declare global {
  interface Window {
    electronAPI: {
      loadResponses: () => Promise<Response[]>;
      saveResponse: (response: Response) => Promise<boolean>;
      loadSettings: () => Promise<Settings>;
      saveSettings: (settings: Settings) => Promise<boolean>;
    };
  }
}

export class DataService {
  async loadResponses(): Promise<Response[]> {
    return window.electronAPI.loadResponses();
  }

  async saveResponse(response: Response): Promise<boolean> {
    return window.electronAPI.saveResponse(response);
  }

  async loadSettings(): Promise<Settings> {
    return window.electronAPI.loadSettings();
  }

  async saveSettings(settings: Settings): Promise<boolean> {
    return window.electronAPI.saveSettings(settings);
  }
}
