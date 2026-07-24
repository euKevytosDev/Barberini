package br.com.barberini.service;

import br.com.barberini.dto.CadastroRequest;
import br.com.barberini.dto.LoginRequest;
import br.com.barberini.model.Papel;
import br.com.barberini.model.Usuario;
import br.com.barberini.repository.UsuarioRepository;
import br.com.barberini.security.JwtService;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class AuthService {

    private final UsuarioRepository usuarios;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final GoogleTokenService googleTokens;

    public AuthService(
            UsuarioRepository usuarios,
            PasswordEncoder encoder,
            JwtService jwt,
            GoogleTokenService googleTokens
    ) {
        this.usuarios = usuarios;
        this.encoder = encoder;
        this.jwt = jwt;
        this.googleTokens = googleTokens;
    }

    public Map<String, Object> cadastrar(CadastroRequest req) {
        String email = req.email().trim().toLowerCase();
        if (usuarios.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "E-mail já cadastrado");
        }
        Usuario u = usuarios.save(new Usuario(
                email, req.nome().trim(), encoder.encode(req.senha()), Papel.CLIENTE
        ));
        return respostaAuth(u);
    }

    public Map<String, Object> login(LoginRequest req) {
        Usuario u = usuarios.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos"));
        if (!encoder.matches(req.senha(), u.getSenhaHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail ou senha inválidos");
        }
        return respostaAuth(u);
    }

    public Map<String, Object> loginGoogle(String credential) {
        GoogleIdToken.Payload payload = googleTokens.verificar(credential);
        String email = payload.getEmail().trim().toLowerCase();
        String nome = payload.get("name") != null
                ? String.valueOf(payload.get("name")).trim()
                : email.split("@")[0];
        if (nome.isBlank()) {
            nome = "Cliente";
        }

        Usuario u = usuarios.findByEmailIgnoreCase(email).orElse(null);
        if (u == null) {
            // Senha aleatória — conta só entra via Google
            u = usuarios.save(new Usuario(
                    email,
                    nome,
                    encoder.encode(UUID.randomUUID().toString()),
                    Papel.CLIENTE
            ));
        }
        return respostaAuth(u);
    }

    private Map<String, Object> respostaAuth(Usuario u) {
        String token = jwt.gerarToken(u.getId(), u.getEmail(), u.getPapel().name());
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("token", token);
        out.put("usuario", Map.of(
                "id", u.getId(),
                "nome", u.getNome(),
                "email", u.getEmail(),
                "papel", u.getPapel().name()
        ));
        return out;
    }
}
