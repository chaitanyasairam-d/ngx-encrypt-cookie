import { Injectable, Inject, PLATFORM_ID, InjectionToken } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root',
})
export class NgxEncryptCookieService {
  private readonly documentIsAccessible: boolean;

  constructor(

    @Inject(PLATFORM_ID) private platformId: InjectionToken<object>
  ) {

    this.documentIsAccessible = isPlatformBrowser(this.platformId);
  }



  /**
   * @param keySize Cookie name
   * @param passPhrase secret passPhrase 
   * @returns returns key when setting cookie and getting cookie
   * default keySize is 128/32 and default passPhrase is "Secret PassPhrase"
   */
  generateKey(keySize?: string, passPhrase?: string) {

    var salt = CryptoJS.lib.WordArray.random(128 / 8);
    var keySizeBytes;
    var secrtePassPhrase;

    keySize ? keySizeBytes = keySize : keySizeBytes = "128/32";
    passPhrase ? secrtePassPhrase = passPhrase : secrtePassPhrase = "Secret PassPhrase";

    switch (keySizeBytes) {
      case "128/32": var msg = CryptoJS.PBKDF2(secrtePassPhrase, salt, { keySize: 128 / 32 })
        return msg.toString()
        break;
      case "256/32": var msg = CryptoJS.PBKDF2(secrtePassPhrase, salt, { keySize: 256 / 32 })
        return msg.toString()
        break;
      case "512/32": var msg = CryptoJS.PBKDF2(secrtePassPhrase, salt, { keySize: 512 / 32 })
        return msg.toString()
        break;
    }
  }


  /** 
   * encrypt() is calling when set() calls
   * @param val value to store in cookies
   * @param secret_key is a key generated by using generateKey() or user defined key.
   * @returns encrypted val to set() and there the cookie will set. if user doesnt generateKey or pass key error will be thrown.
  */
  private encrypt(val: String, secret_key: String) {

    if (secret_key != null || secret_key != "" || secret_key.length > 0) {
      var encrypt_msg = CryptoJS.AES.encrypt(val, secret_key);
      return encrypt_msg;
    }
    else {
      console.error("Pass Secret key to set cookie");
    }
  }



  /**
   * 
   * @param cookie_name cookie name which is stored
   * @param encrypted boolean - cookie stored having encrypted val or not
   * @param secret_key is key which is used to encrypt cookie val. it is not required if encrypted is false
   */
  private decrypt(cookieName: string, encrypted: boolean, secret_key?: String, ) {
    if (this.documentIsAccessible && this.check(cookieName)) {
      cookieName = encodeURIComponent(cookieName);

      const regExp: RegExp = this.getCookieRegExp(cookieName);
      const result: RegExpExecArray = regExp.exec(document.cookie);

      if (encrypted) {
        if (secret_key) {

          let encrypt_msg = this.safeDecodeURIComponent(result[1]);
          let decrypt_msg = CryptoJS.AES.decrypt(encrypt_msg, secret_key);
          let message = decrypt_msg.toString(CryptoJS.enc.Utf8);
          return message;

        }
        else {
          console.error("pass secret key to get cookie value")
        }
      }
      else {
        return this.safeDecodeURIComponent(result[1]);
      }
    } else {
      return '';
    }
  }


  /**
   * @param cookieName Cookie name
   * @returns boolean  whether cookie with specified name is existed or not
   */
  check(cookieName: string): boolean {
    if (!this.documentIsAccessible) {
      return false;
    }

    var name = encodeURIComponent(cookieName);

    const regExp: RegExp = this.getCookieRegExp(name);
    const exists: boolean = regExp.test(document.cookie);

    return exists;
  }


  /**
   * 
   * @param cookieName cookie name
   * @param encryption boolean - whether to want encrypted or decrypted value. 
   * @param key - it should enter if encrypted=true otherwise error will be thrown.key can be either generated using generateKey() or
                   user definded key
   */
  get(cookieName: string, encryption: boolean, key?: string, ): string {
    var val:string;
     if(encryption){
       if(key){
        val = this.decrypt(cookieName, encryption, key);
        return val;
       }
        }

        // if key is not passed or encrypted = false;
    val = this.decrypt(cookieName,false,null);
    return val;

  }


  /**
   * @param encrypted boolean - to know encrypted values are there
   * @param key  generatedKey() or user defined key - to decrypt encrypted values
   * @returns cookies - all the cookies  stored
   */
  getAll(encrypted?: boolean, key?: string): { [key: string]: string } {
    if (!this.documentIsAccessible) {
      return {};
    }
    const cookies: { [key: string]: string } = {};

    if (encrypted) {
      if (document.cookie && document.cookie !== '') {

        document.cookie.split(';').forEach((currentCookie) => {
          const [cookieName, cookieValue] = currentCookie.split('=');
          var cookie_name = this.safeDecodeURIComponent(cookieName.replace(/^ /, ''));
          var cookie_val = this.get(cookie_name, encrypted, key)
          cookies[this.safeDecodeURIComponent(cookieName.replace(/^ /, ''))] = cookie_val
          // cookies[]
        });
      }
    }
    else {
      if (document.cookie && document.cookie !== '') {

        document.cookie.split(';').forEach((currentCookie) => {
          const [cookieName, cookieValue] = currentCookie.split('=');
          var cookie_name = this.safeDecodeURIComponent(cookieName.replace(/^ /, ''));
          cookies[this.safeDecodeURIComponent(cookieName.replace(/^ /, ''))] = this.safeDecodeURIComponent(cookieValue)
          // cookies[]
        });
      }
    }

    return cookies
  }


  private getAllCookies() {
    if (!this.documentIsAccessible) {
      return {};
    }
    const cookies: { [key: string]: string } = {};

    if (document.cookie && document.cookie !== '') {

      document.cookie.split(';').forEach((currentCookie) => {
        const [cookieName, cookieValue] = currentCookie.split('=');
        var cookie_name = this.safeDecodeURIComponent(cookieName.replace(/^ /, ''));
        cookies[this.safeDecodeURIComponent(cookieName.replace(/^ /, ''))] = this.safeDecodeURIComponent(cookieValue)
        // cookies[]
      });
    }

    return cookies
  }



  /**
   * @param name     Cookie name
   * @param value    Cookie value
   * @param encrypt  boolean - to encrypt cookie value or not
   * @param key      a key can either generate using generateKey() or user defined key 
   * @param expires  Number of days until the cookies expires or an actual `Date`
   * @param path     Cookie path (eg:"/")
   * @param domain   Cookie domain (eg:"domain.com")
   * @param secure   Secure flag
   * @param sameSite OWASP samesite token `Lax`, `None`, or `Strict`. Defaults to `Lax`
   */
  set(
    name: string,
    value: string,
    encrypt: boolean,
    key?: string,
    expires?: number | Date,
    path?: string,
    domain?: string,
    secure?: boolean,
    sameSite: 'Lax' | 'None' | 'Strict' = 'Lax'
  ): any {
    var cookieString: string;

    if (!this.documentIsAccessible) {
      return;
    }

    if (encrypt) {
     if(key){
      let encrypted_msg = this.encrypt(value, key)
      cookieString = encodeURIComponent(name) + '=' + encodeURIComponent(encrypted_msg) + ';';
     }
     else{
       console.error("pass key to encrypt cookie value");
       return "key fail";
     }
    }
    else {
      cookieString = encodeURIComponent(name) + '=' + encodeURIComponent(value) + ';';
    }

    if (expires) {
      if (typeof expires === 'number') {
        const dateExpires: Date = new Date(new Date().getTime() + expires * 1000 * 60 * 60 * 24);

        cookieString += 'expires=' + dateExpires.toUTCString() + ';';
      } else {
        cookieString += 'expires=' + expires.toUTCString() + ';';
      }
    }

    if (path) {
      cookieString += 'path=' + path + ';';
    }

    if (domain) {
      cookieString += 'domain=' + domain + ';';
    }

    if (secure === false && sameSite === 'None') {
      secure = true;
      console.warn(
        `[ngx-secure-cookies] Cookie ${name} was forced with secure flag because sameSite=None.`);
    }

    if (secure) {
      cookieString += 'secure;';
    }

    cookieString += 'sameSite=' + sameSite + ';';

    document.cookie = cookieString;
    return true;
  }

  /**
   * @param name   Cookie name
   * @param path   Cookie path
   * @param domain Cookie domain
   */

  delete(name: string, path?: string, domain?: string, secure?: boolean, sameSite: 'Lax' | 'None' | 'Strict' = 'Lax'): void {
    if (!this.documentIsAccessible) {
      return;
    }

    this.set(name, '', false, "", new Date('Thu, 01 Jan 1970 00:00:01 GMT'), path, domain, secure, sameSite);
  }




  /**
   * @param path   Cookie path
   * @param domain Cookie domain
   */
  deleteAll(path?: string, domain?: string, secure?: boolean, sameSite: 'Lax' | 'None' | 'Strict' = 'Lax'): void {
    if (!this.documentIsAccessible) {
      return;
    }

    const cookies: any = this.getAllCookies();

    for (const cookieName in cookies) {
      if (cookies.hasOwnProperty(cookieName)) {
        this.delete(cookieName, path, domain, secure, sameSite);
      }
    }
  }





  /**
   * @param name Cookie name
   * @returns property RegExp
   */
  private getCookieRegExp(name: string): RegExp {
    const escapedName: string = name.replace(/([\[\]\{\}\(\)\|\=\;\+\?\,\.\*\^\$])/gi, '\\$1');

    return new RegExp('(?:^' + escapedName + '|;\\s*' + escapedName + ')=(.*?)(?:;|$)', 'g');
  }

  private safeDecodeURIComponent(encodedURIComponent: string): string {
    try {
      return decodeURIComponent(encodedURIComponent);
    } catch {
      return encodedURIComponent;
    }
  }
}
