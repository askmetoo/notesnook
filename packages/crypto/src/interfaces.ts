/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import {
  Cipher,
  EncryptionKey,
  OutputFormat,
  Plaintext,
  SerializedKey,
  Chunk
} from "./types";

export interface IStreamable {
  read(): Promise<Chunk | undefined>;
  write(chunk: Chunk | undefined): Promise<void>;
}

export interface INNCrypto {
  encrypt(
    key: SerializedKey,
    plaintext: Plaintext,
    outputFormat?: OutputFormat
  ): Promise<Cipher>;

  decrypt(
    key: SerializedKey,
    cipherData: Cipher,
    outputFormat?: OutputFormat
  ): Promise<Plaintext>;

  hash(password: string, salt: string): Promise<string>;

  deriveKey(password: string, salt?: string): Promise<EncryptionKey>;

  exportKey(password: string, salt?: string): Promise<SerializedKey>;

  encryptStream(
    key: SerializedKey,
    stream: IStreamable,
    streamId?: string
  ): Promise<string>;

  decryptStream(
    key: SerializedKey,
    iv: string,
    stream: IStreamable,
    streamId?: string
  ): Promise<void>;
}
