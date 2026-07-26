import { describe, expect, it } from 'vitest';
import { getAllowedServiceBagHosts, validateServiceBagUrl } from './urlPolicy';

describe('politique URL ServiceBag', () => {
  it('autorise un domaine explicitement configuré', () => {
    expect(validateServiceBagUrl('https://servicebag.example.fr/prestation/123', ['servicebag.example.fr']))
      .toBe('https://servicebag.example.fr/prestation/123');
  });

  it('autorise les sous-domaines du domaine configuré', () => {
    expect(validateServiceBagUrl('https://prod.servicebag.example.fr/', ['servicebag.example.fr']))
      .toBe('https://prod.servicebag.example.fr/');
  });

  it('refuse un domaine absent de la liste blanche', () => {
    expect(() => validateServiceBagUrl('https://example.org/', ['servicebag.example.fr']))
      .toThrow('Domaine non autorisé');
  });

  it('refuse les protocoles non web', () => {
    expect(() => validateServiceBagUrl('file:///tmp/test.html', ['localhost']))
      .toThrow('HTTP ou HTTPS');
  });

  it('supprime les identifiants intégrés dans une URL', () => {
    expect(validateServiceBagUrl('https://agent:secret@servicebag.example.fr/', ['servicebag.example.fr']))
      .toBe('https://servicebag.example.fr/');
  });

  it('lit les domaines configurés dans une chaîne séparée par des virgules', () => {
    expect(getAllowedServiceBagHosts('servicebag.example.fr, portail.example.fr'))
      .toEqual(expect.arrayContaining(['localhost', '127.0.0.1', 'servicebag.example.fr', 'portail.example.fr']));
  });
});
