package br.com.barberini.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

/**
 * O ddl-auto=update cria a restrição do enum de status (ENUM nativo no H2, CHECK no Postgres)
 * e nunca a atualiza quando novos valores entram. Sem isso, gravar FINALIZADO/NAO_COMPARECEU
 * quebra em bancos que já existiam. Converte a coluna para varchar simples.
 */
@Configuration
public class SchemaFixer {

    private static final Logger log = LoggerFactory.getLogger(SchemaFixer.class);

    @Bean
    @Order(0)
    CommandLineRunner normalizarColunaStatus(JdbcTemplate jdbc) {
        return args -> {
            removerChecksObsoletos(jdbc);
            converterParaVarchar(jdbc);
        };
    }

    private void removerChecksObsoletos(JdbcTemplate jdbc) {
        try {
            List<String> obsoletos = jdbc.queryForList("""
                    select tc.constraint_name
                    from information_schema.table_constraints tc
                    join information_schema.check_constraints cc
                      on cc.constraint_name = tc.constraint_name
                     and cc.constraint_schema = tc.constraint_schema
                    where lower(tc.table_name) = 'agendamentos'
                      and tc.constraint_type = 'CHECK'
                      and cc.check_clause like '%CONFIRMADO%'
                      and cc.check_clause not like '%NAO_COMPARECEU%'
                    """, String.class);

            for (String nome : obsoletos) {
                jdbc.execute("alter table agendamentos drop constraint \"" + nome + "\"");
                log.info("Restrição de status desatualizada removida: {}", nome);
            }
        } catch (Exception e) {
            log.warn("Não foi possível revisar as restrições de status: {}", e.getMessage());
        }
    }

    private void converterParaVarchar(JdbcTemplate jdbc) {
        try {
            String tipo = jdbc.queryForObject("""
                    select data_type from information_schema.columns
                    where lower(table_name) = 'agendamentos' and lower(column_name) = 'status'
                    """, String.class);
            if (tipo == null || tipo.toLowerCase().contains("char")) return;

            String banco = jdbc.execute(
                    (ConnectionCallback<String>) c -> c.getMetaData().getDatabaseProductName());
            String sql = banco != null && banco.toLowerCase().contains("postgre")
                    ? "alter table agendamentos alter column status type varchar(20)"
                    : "alter table agendamentos alter column status varchar(20) not null";
            jdbc.execute(sql);
            log.info("Coluna status convertida de {} para varchar", tipo);
        } catch (Exception e) {
            log.warn("Não foi possível converter a coluna status: {}", e.getMessage());
        }
    }
}
