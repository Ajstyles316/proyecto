import { Link } from "react-router";
import logoicn from "src/assets/images/logos/logo_cofa_new.png";
import { styled } from "@mui/material";

const LinkStyled = styled(Link)(() => ({
  height: "70px",
  width: "180px",
  overflow: "hidden",
  display: "block",
}));

const Logo = () => {
  return (
    <LinkStyled
      to="/"
      height={70}
      style={{
        display: "flex",
        alignItems: "center", justifyContent: 'center'
      }}
    >
      <Logo img={logoicn}/>
    </LinkStyled>
  );
};

export default Logo;
