/**
 * Reference data for the Finik signature, not secrets:
 * - the TEST key pair and signature published with Finik's own library
 *   `@mancho.devs/authorizer` (its README / tests);
 * - a real webhook from Finik's docs («Вебхуки → как проверить подпись»),
 *   signed with Finik's PRODUCTION key.
 */
export const FINIK_TEST_PRIVATE_KEY =
  '-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAKCAQEAoq/3UxpzgfXOLrJEZd39TJ7Fc4iRLMcK1Hj563O+sNcP4BnA\neNnRXfCCJCLs+UZxPLxV7f1Zj7zHmgUOsB6rPS3TJwbIIbclDrhoySzPAnTNg+jU\n9lpPS99vvT8tJpUb0zAA6sAwFxHUQk43mzgLou04eMlSHZmZ4MFVGzWGakIwDRlP\nMQbQCOiU+N/0Kl7qBDwDkn6USwc16MTa2Xm6BAhcwaug0jlhN5NIu7hyK2gk8In1\nS0OrxBEK3Z1zShRhixGEhA8Z7NREJCMuqHke09dVK1nVXz6CGTQMafjDKDwgmiBR\n7cJo25Icb/OqFs4TzE7XPfU/3gK0+1YdqF4J/wIDAQABAoIBADY3DeTT28pjb+J/\n5etMnyz5fDOUP0z8x88mwaKFX/butIuqCUo8zFjR3YzNVst7fiEPYlN9KmuMLbhW\nFx76GXa53rQSvn792YueSM1B8XqQEizzWoT+c46FV2dptlI1PqCSTrvscBpABsxR\n5JYFh1s0Uq1t6b+TgIQ16Xa3z6N5AyLVw7MbXEx2iB/bVdivmWNIjLWarr4yJDwA\nMgB/dOYtZp80ut8yOYYvaTmUVBUEp4ZHjBN+MgNlMD0zDZR/y+5mr1r3TfuPUsw9\neIDpD6tYwHvDgoneSGi1LtQpuEXTKhwEFezJkLZZnVCtFCdRaKkS607fT37fJOML\nDfNOgYECgYEAzpzgjzCz3+2qHJl+ejRtw2cUxCOIvVBAzvbqVk8R/NqZVF2WteUh\nx/0lM+FK0/AHpcnpZu79ruvra3yaB/AZuaPOnrsjzLQ2xsJfLpEu0Caoho3jWP7J\nFDGhX1CQeRXEQ9VM6l+PbjoKZ4bRO6ktVMuq/D7gBNvh/mNglCziLLsCgYEAyZMw\nO91zk+4DJucflLuNKiS56J8Sq71v6j+iFwF6zimYJJAFm7xdQ2vWXSP5jf5SeKVr\nQ/aA0ACSi0iYBEzhtQ19cCydjYQKSRvO0olMvRbcJfVgABCN+JtFIaSnWLS/sXST\nzcH3vm4FgccRHtt27HQIVCFHgwwVapymAYfnRY0CgYAPKTHNMAyy7NSjvpuqSfiX\n8xNyBQ1+nsnypemyJaEzRbMknq11cXfWHfxB31FHVgCpqLRIylaxJDylKYJ//J1W\nou+BdEf/OGYglZi4aQzfV0bcgMLi/+cvZSjrPpUrXW6Gb7tyI0r6EqY6zIjD8PkT\nlNJaKh70HFJsAUzP8q8yCwKBgQCFyFJy6P8UZxtgbnTfWbrPBaD9atYRdaEZbzI8\n4paGzcRUP+H5AoNDhAa5um6edvR1bhRK/wdvBXI9TujVsdD7QQDHulS237OT4gja\nYpWzycBC0R/t6w7OuP6g3Y7TqOKw/BY8sUej85FkGKKcQDwlor0EWTIFH7f3EhB7\nY59y4QKBgB5K2pRrw3wjQOHlssEO/2FqwE1NTYZalgpghPLRO+4Y8qM8hkKsBjgQ\nAQhd66mWIbIvuvcGErUrz3qFJHtjTIZHqOSVlW3hiiuMVKzZCoPa8nUJ0l6ylTpz\nNIb/T0HUwXgSRJBNhdHNo0yGFisaJpezF/kDUhOCzvTdoNI/M0Zy\n-----END RSA PRIVATE KEY-----\n';
export const FINIK_TEST_PUBLIC_KEY =
  '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoq/3UxpzgfXOLrJEZd39\nTJ7Fc4iRLMcK1Hj563O+sNcP4BnAeNnRXfCCJCLs+UZxPLxV7f1Zj7zHmgUOsB6r\nPS3TJwbIIbclDrhoySzPAnTNg+jU9lpPS99vvT8tJpUb0zAA6sAwFxHUQk43mzgL\nou04eMlSHZmZ4MFVGzWGakIwDRlPMQbQCOiU+N/0Kl7qBDwDkn6USwc16MTa2Xm6\nBAhcwaug0jlhN5NIu7hyK2gk8In1S0OrxBEK3Z1zShRhixGEhA8Z7NREJCMuqHke\n09dVK1nVXz6CGTQMafjDKDwgmiBR7cJo25Icb/OqFs4TzE7XPfU/3gK0+1YdqF4J\n/wIDAQAB\n-----END PUBLIC KEY-----\n';

export const FINIK_LIBRARY_VECTOR = {
  request: {
    method: 'POST',
    path: '/services',
    headers: {
      Host: 'api.paymentsgateway.averspay.kg',
      'x-api-timestamp': '1636026186643',
      'x-api-key': 'h8z1TDStxu5YY2YuN8jUa9hpzIVbfkLT7kPiPiYj',
      'x-api-header': 'header value',
      'X-Forwarded-For': '54.187.127.20, 15.158.4.100',
    },
    body: { payment: 'payment', amount: 100 },
    query: { from: '0', size: '10', test: undefined, best: 'тест дата' },
  },
  canonical:
    'post\n/services\nhost:api.paymentsgateway.averspay.kg&x-api-header:header value&x-api-key:h8z1TDStxu5YY2YuN8jUa9hpzIVbfkLT7kPiPiYj&x-api-timestamp:1636026186643\nbest=%D1%82%D0%B5%D1%81%D1%82%20%D0%B4%D0%B0%D1%82%D0%B0&from=0&size=10&test=\n{"amount":100,"payment":"payment"}',
  signature:
    'TiQCuWaV1WE/VDsbYKn6O0B2diji6MyZI6zjC8Q9lEdnc6KkxURnot1i874fw8q5cyBpLXO6T7dH70VpC11pT1vlrZDZe+PzGnYe27pRqwxU6KcohG5iYp5eeUjQHNaJHL/7zkJdCRu6nIj0z84xbLYMYbPBfTHPPp+viwnGqEdR4wIcjVm18Op3WKgOj5zTv2HB4ATNi31nERYN2R3/ecn+CgK8tIf6Ox3azhNJat3oIQT6Gk10wvAROLsNFKm82Px3CeT/lXO1d8UeeTMNGe8mvo7POGUrH4UJhjsa1myvpNyKeW1vF1kuSv8bFcoJfkXbiZ51gHGxpoL8MmYhlA==',
};

export const FINIK_DOCS_WEBHOOK = {
  path: '/finik-callback',
  headers: {
    'Content-Type': 'application/json',
    Host: 'huntpro.kg',
    'x-api-timestamp': '1781763261255',
  },
  body: {
    fields: {
      amount: 1,
      webhook_url: 'https://huntpro.kg/finik-callback',
      paymentId: '141fc797-0366-480e-8ba7-2982632b2b2c',
      success_redirect_url:
        'https://api.acquiring.averspay.kg/v1/redirect?paymentId=141fc797-0366-480e-8ba7-2982632b2b2c&clientId=1295102413&status=succeeded',
      name: 'HuntPro',
      qrTransactionId: 'aaa76e79-f808-4ac5-b88e-76a9b4055832',
    },
    amount: 1,
    transactionDate: 1781697937466,
    clientId: '25c1aabe-fc4a-4968-85d9-90600466e9a5',
    id: '320259584_aaa76e79-f808-4ac5-b88e-76a9b4055832_DEBIT',
    status: 'succeeded',
    transactionId: '141fc797-0366-480e-8ba7-2982632b2b2c',
    data: {
      accountId: '8d4e1d11-e50c-4278-a5e2-4e55de196c6a',
      description: 'Order 2606',
      webhookUrl: 'https://huntpro.kg/finik-callback',
      name_en: 'HuntPro',
    },
  },
  signature:
    'jS1a8HW4BTIea8iCmoW/EF7FXUA0JSsHe/kSRBfCYdxFwvyrMe0SOfU9pAKzOOO0bIsa9FW+WqAzqxExHjcscmG8k/vwgB+dCMcM04K91vTL6eZAVOE/Hcx2iALNZnG6UVnP/jnUt8MjK+xwBhamwFktxdUovf+cVFZ2io10RAT1pOEIHtZceXbQeg7XlhcPuTAKmOuF1B4gGoksRtGglGwwyvYaa9ml8OPMP3uoCaauYqT0aUKLTNsJdFfO0Q3Dvsy9uyWvuVa5t6adbIm+SHlbz9VGSZ2xrwgETUBVj86dfA3oiAgERLKhQTBSMTxRYlUKhPVHGfR3kjAhD3g4JQ==',
};
