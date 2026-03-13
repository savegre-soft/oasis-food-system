const ContactCard = ({ contactInfo }) => {
  if (!contactInfo) return null;

  const { Name, Email, Phone, Description, created_at } = contactInfo;

  return (
    <div className="contact-card">
      <h3>{Name}</h3>

      <p>
        <strong>Email:</strong> {Email}
      </p>

      <p>
        <strong>Teléfono:</strong> {Phone}
      </p>

      <p>
        <strong>Mensaje:</strong> {Description}
      </p>

      <small>
        {created_at && new Date(created_at).toLocaleString()}
      </small>
    </div>
  );
};

export default ContactCard;