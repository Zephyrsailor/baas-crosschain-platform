export class CAAdapter {
  issueCertificate({ did, subject }) {
    return {
      certId: `cert-${Date.now()}`,
      did,
      subject,
      issuedAt: new Date().toISOString(),
      signatureAlg: 'SM2',
    };
  }

  verifyCertificate(cert) {
    return Boolean(cert?.certId && cert?.did && cert?.signatureAlg);
  }
}

export const caAdapter = new CAAdapter();
