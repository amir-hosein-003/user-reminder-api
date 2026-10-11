import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MelipayamakApi from 'melipayamak';

@Injectable()
export class SmsService {
  private readonly sms;

  constructor(private readonly configService: ConfigService) {
    const username = this.configService.get('SMS_USERNAME');
    const password = this.configService.get('SMS_PASSWORD');

    const api = new MelipayamakApi(username, password);

    this.sms = api.sms();
  }

  async sendOtp(phone: string, message: string) {
    console.log({ phone, message });
    const from = this.configService.get('SMS_FROM');
    const text = `
      ${message}
      لغو11
    `;

    try {
      const result = await this.sms.send(phone, from, text);

      if (result.RetStatus !== 1) {
        throw new ServiceUnavailableException({
          code: 'SMS_SEND_FAILED',
        });
      }
      
      console.log(result);
      return result;
    } catch {
      throw new ServiceUnavailableException({
        code: 'SMS_SERVICE_UNAVAILABLE',
      });
    }
  }
}
