import axios, { AxiosInstance } from 'axios';
import 'dotenv/config'

const token = process.env.FACEBOOK_CLOUD_API_ACCESS_TOKEN


export interface OutgoingMessageBase {
  messaging_product: 'whatsapp';
  preview_url: boolean;
  recipient_type: string;
  to: string;
}

export interface OutgoingTextBody {
  type: 'text';
  text: {
    body: string;
  };
}

export type OutgoingTextMessage = OutgoingMessageBase & OutgoingTextBody

export type OutgoingMessage = OutgoingTextMessage


const BASE_URL = 'https://graph.facebook.com/v13.0';
const Urls = {
  Messages: (phoneNumberId: string) => `${BASE_URL}/${phoneNumberId}/messages`,
};

export interface IHttpService {
  downloadFile: (url: string) => Promise<Uint8Array>;
  getMediaUrl: (mediaId: string) => Promise<string>;
  message: (phoneNumberId: string, message: OutgoingMessage) => Promise<boolean>;
}

export class HttpService implements IHttpService {
  private readonly httpClient: AxiosInstance;

  constructor() {
    this.httpClient = axios.create({ headers: { 'Authorization': 'Bearer ' + token } });
  }

  getMediaUrl(mediaId: string): Promise<string> {
    console.log("GetMediaUrl with "+mediaId);
    return this.httpClient.get(`${BASE_URL}/${mediaId}`)
      .then(response => (response.data.url as string))
      .catch(error => {
        console.error("got error in GetMediaUrl", error)
        throw error;
      });
  }

  downloadFile(url: string): Promise<Uint8Array> {
    console.log("downloadFile with "+url);
    return this.httpClient.get(url, { responseType: 'arraybuffer' })
      .then(response => (response.data as any))
      .catch(error => {
        console.error("got error in downloadFile", error)
        throw error;
      });
  }

  message(fromPhoneNumberId: string, message: OutgoingMessage): Promise<boolean> {
    const url = Urls.Messages(fromPhoneNumberId);
    console.log("message with "+fromPhoneNumberId);

    return this.httpClient.post(url, message)
      .then(({ data }) => {
        console.log("message sent and got back "+data)
        return true;
      })
      .catch(error => {
        console.error("got error in sending message", error)
        return false;
      });
  }

}
