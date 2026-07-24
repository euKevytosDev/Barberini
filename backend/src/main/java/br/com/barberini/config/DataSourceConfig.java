package br.com.barberini.config;

import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

/**
 * Aceita URL no formato Neon/Postgres puro (postgresql://...) e converte
 * para JDBC (jdbc:postgresql://...), pra não quebrar se colar a URI errada no Render.
 */
@Configuration
@Profile("postgres")
public class DataSourceConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties() {
            @Override
            public String determineUrl() {
                return normalizarJdbc(super.determineUrl());
            }

            @Override
            public void setUrl(String url) {
                super.setUrl(normalizarJdbc(url));
            }
        };
    }

    static String normalizarJdbc(String url) {
        if (url == null || url.isBlank()) return url;
        String u = url.trim();
        if (u.startsWith("jdbc:")) return u;
        if (u.startsWith("postgresql://") || u.startsWith("postgres://")) {
            return "jdbc:" + u;
        }
        return u;
    }
}
