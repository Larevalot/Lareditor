import type { Lang } from '../i18n';

interface PrivacyPolicyProps {
  lang: Lang;
  onClose: () => void;
}

const privacyContent = {
  en: {
    title: 'Privacy Policy',
    lastUpdated: 'Last updated: June 2025',
    intro: 'At larEditor, we are committed to protecting your privacy. This Privacy Policy explains how we handle information when you use our video editing application.',
    sections: [
      {
        title: '1. Information We Collect',
        content: 'larEditor does not collect any personal information. We do not require registration, login, email addresses, or any form of user account. All processing happens directly in your browser.',
      },
      {
        title: '2. Local Processing',
        content: 'All video editing operations are performed entirely on your device using WebAssembly (FFmpeg.wasm). Your videos, images, audio files, and any content you create never leave your computer. No data is uploaded to any server.',
      },
      {
        title: '3. No Cookies or Tracking',
        content: 'We do not use cookies, analytics trackers, or any tracking technologies. We do not monitor your usage patterns or collect behavioral data.',
      },
      {
        title: '4. Local Storage',
        content: 'We only use your browser\'s localStorage to save your preferences (theme and language settings). This data remains on your device and is not accessible to us.',
      },
      {
        title: '5. Third-Party Services',
        content: 'Our application loads the FFmpeg WebAssembly core from unpkg.com (a public CDN) to enable video processing. This is a one-time download of the processing engine and does not involve any data collection.',
      },
      {
        title: '6. Children\'s Privacy',
        content: 'Our service does not address anyone under the age of 13. We do not knowingly collect personal information from children.',
      },
      {
        title: '7. Changes to This Policy',
        content: 'We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.',
      },
      {
        title: '8. Contact',
        content: 'If you have any questions about this Privacy Policy, you can contact us through our social media channels.',
      },
    ],
    close: 'Close',
  },
  es: {
    title: 'Política de Privacidad',
    lastUpdated: 'Última actualización: Junio 2025',
    intro: 'En larEditor, nos comprometemos a proteger tu privacidad. Esta Política de Privacidad explica cómo manejamos la información cuando utilizas nuestra aplicación de edición de video.',
    sections: [
      {
        title: '1. Información que Recopilamos',
        content: 'larEditor no recopila ninguna información personal. No requerimos registro, inicio de sesión, direcciones de correo electrónico ni ningún tipo de cuenta de usuario. Todo el procesamiento ocurre directamente en tu navegador.',
      },
      {
        title: '2. Procesamiento Local',
        content: 'Todas las operaciones de edición de video se realizan completamente en tu dispositivo usando WebAssembly (FFmpeg.wasm). Tus videos, imágenes, archivos de audio y cualquier contenido que crees nunca salen de tu computadora. No se sube ningún dato a ningún servidor.',
      },
      {
        title: '3. Sin Cookies ni Rastreo',
        content: 'No utilizamos cookies, analíticas de rastreo ni ninguna tecnología de seguimiento. No monitoreamos tus patrones de uso ni recopilamos datos de comportamiento.',
      },
      {
        title: '4. Almacenamiento Local',
        content: 'Solo utilizamos el localStorage de tu navegador para guardar tus preferencias (configuración de tema e idioma). Estos datos permanecen en tu dispositivo y no son accesibles para nosotros.',
      },
      {
        title: '5. Servicios de Terceros',
        content: 'Nuestra aplicación carga el núcleo de FFmpeg WebAssembly desde unpkg.com (un CDN público) para permitir el procesamiento de video. Esta es una descarga única del motor de procesamiento y no involucra ninguna recopilación de datos.',
      },
      {
        title: '6. Privacidad de Menores',
        content: 'Nuestro servicio no está dirigido a personas menores de 13 años. No recopilamos conscientemente información personal de menores.',
      },
      {
        title: '7. Cambios en esta Política',
        content: 'Podemos actualizar nuestra Política de Privacidad de vez en cuando. Te notificaremos de cualquier cambio publicando la nueva Política de Privacidad en esta página.',
      },
      {
        title: '8. Contacto',
        content: 'Si tienes alguna pregunta sobre esta Política de Privacidad, puedes contactarnos a través de nuestros canales de redes sociales.',
      },
    ],
    close: 'Cerrar',
  },
  it: {
    title: 'Informativa sulla Privacy',
    lastUpdated: 'Ultimo aggiornamento: Giugno 2025',
    intro: 'In larEditor, ci impegniamo a proteggere la tua privacy. Questa Informativa sulla Privacy spieghiamo come gestiamo le informazioni quando utilizzi la nostra applicazione di editing video.',
    sections: [
      {
        title: '1. Informazioni che Raccogliamo',
        content: 'larEditor non raccoglie alcuna informazione personale. Non richiediamo registrazione, accesso, indirizzi email o alcun tipo di account utente. Tutta l\'elaborazione avviene direttamente nel tuo browser.',
      },
      {
        title: '2. Elaborazione Locale',
        content: 'Tutte le operazioni di editing video vengono eseguite interamente sul tuo dispositivo utilizzando WebAssembly (FFmpeg.wasm). I tuoi video, immagini, file audio e qualsiasi contenuto che crei non escono mai dal tuo computer. Nessun dato viene caricato su alcun server.',
      },
      {
        title: '3. Nessun Cookie o Tracciamento',
        content: 'Non utilizziamo cookie, tracker analitici o tecnologie di tracciamento. Non monitoriamo i tuoi pattern di utilizzo né raccogliamo dati comportamentali.',
      },
      {
        title: '4. Archiviazione Locale',
        content: 'Utilizziamo solo il localStorage del tuo browser per salvare le tue preferenze (impostazioni di tema e lingua). Questi dati rimangono sul tuo dispositivo e non sono accessibili a noi.',
      },
      {
        title: '5. Servizi di Terze Parti',
        content: 'La nostra applicazione carica il nucleo FFmpeg WebAssembly da unpkg.com (un CDN pubblico) per abilitare l\'elaborazione video. Questo è un download singolo del motore di elaborazione e non comporta alcuna raccolta di dati.',
      },
      {
        title: '6. Privacy dei Minori',
        content: 'Il nostro servizio non è rivolto a persone di età inferiore ai 13 anni. Non raccogliamo consapevolmente informazioni personali da minori.',
      },
      {
        title: '7. Modifiche a questa Informativa',
        content: 'Potremmo aggiornare la nostra Informativa sulla Privacy di tanto in tanto. Ti avviseremo di qualsiasi modifica pubblicando la nuova Informativa sulla Privacy su questa pagina.',
      },
      {
        title: '8. Contatto',
        content: 'Se hai domande su questa Informativa sulla Privacy, puoi contattarci attraverso i nostri canali social media.',
      },
    ],
    close: 'Chiudi',
  },
};

export function PrivacyPolicy({ lang, onClose }: PrivacyPolicyProps) {
  const content = privacyContent[lang] || privacyContent.en;

  return (
    <div className="privacy-overlay" onClick={onClose}>
      <div className="privacy-modal" onClick={(e) => e.stopPropagation()}>
        <div className="privacy-header">
          <h2>{content.title}</h2>
          <button className="privacy-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <p className="privacy-date">{content.lastUpdated}</p>
        <p className="privacy-intro">{content.intro}</p>
        <div className="privacy-content">
          {content.sections.map((section, index) => (
            <div key={index} className="privacy-section">
              <h3>{section.title}</h3>
              <p>{section.content}</p>
            </div>
          ))}
        </div>
        <button className="privacy-btn-close" onClick={onClose}>
          {content.close}
        </button>
      </div>
    </div>
  );
}
