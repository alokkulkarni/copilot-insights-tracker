import './Footer.css';

function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner">
        <p className="footer__copy">© 2026 Virgin Money. All rights reserved.</p>
        <p className="footer__note">
          Data sourced from the{' '}
          <a
            href="https://docs.github.com/en/rest/copilot"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub Copilot REST API
          </a>
          . Refresh every 5 minutes.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
