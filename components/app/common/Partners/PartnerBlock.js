import React from 'react';
import { Link } from 'routes';

function PartnerBlock(props) {
  const partner = props.item;

  if (!partner) {
    return null;
  }

  const imgPath = partner.logo ? `${process.env.STATIC_SERVER_URL}${partner.logo.medium}` : '';

  return (
    <article className="c-partners-block">
      <div className="logo-container">
        <Link
          route={'partner'}
          params={{ id: partner.slug }}
        >
          <img src={imgPath} className="logo" title={partner.name} alt={partner.name} />
        </Link>
      </div>
      <p>{partner.summary}</p>
      <div className="buttons -align-center">
        <Link
          route={'partner'}
          params={{ id: partner.slug }}
        >
          <a className="c-btn -secondary">Read more</a>
        </Link>
      </div>
    </article>
  );
}

PartnerBlock.propTypes = {
  item: React.PropTypes.object
};

export default PartnerBlock;
