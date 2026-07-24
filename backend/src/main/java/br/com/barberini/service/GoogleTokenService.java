package br.com.barberini.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;

@Service
public class GoogleTokenService {

    private final GoogleIdTokenVerifier verifier;

    public GoogleTokenService(@Value("${app.google.client-id}") String clientId) {
        this.verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                GsonFactory.getDefaultInstance()
        )
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public GoogleIdToken.Payload verificar(String credential) {
        try {
            GoogleIdToken idToken = verifier.verify(credential);
            if (idToken == null) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token Google inválido");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            if (Boolean.FALSE.equals(payload.getEmailVerified())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "E-mail Google não verificado");
            }
            return payload;
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Falha ao validar login Google");
        }
    }
}
